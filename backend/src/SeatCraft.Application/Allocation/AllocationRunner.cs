using System.Diagnostics;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Domain.Common;
using SeatCraft.Domain.Entities;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Allocation;

/// <summary>
/// Executes one queued allocation run end to end: load, solve, persist, publish
/// metrics. Lives in the application layer so the API stays thin and the queue
/// worker has no HTTP knowledge.
/// </summary>
public sealed class AllocationRunner(
    ISeatCraftData data,
    IUnitOfWork unitOfWork,
    IDistributedLock distributedLock)
{
    private static readonly TimeSpan LockTtl = TimeSpan.FromMinutes(10);

    public async Task RunAsync(AllocationJob job, CancellationToken cancellationToken = default)
    {
        await using var handle = await distributedLock.TryAcquireAsync(
            $"allocation:exam:{job.ExamId}",
            LockTtl,
            cancellationToken);

        if (handle is null)
        {
            // Another worker holds the exam lock; fail loudly instead of leaving the run queued forever.
            var blocked = await data.AllocationRuns.FindAsync(job.RunId, cancellationToken);

            if (blocked is not null && blocked.Status == AllocationRunStatus.Queued)
            {
                blocked.Fail("Another allocation run is already in progress for this exam.");
                await unitOfWork.SaveChangesAsync(cancellationToken);
            }

            return;
        }

        var run = await data.AllocationRuns.FindAsync(job.RunId, cancellationToken);
        if (run is null || run.Status != AllocationRunStatus.Queued)
            return;

        run.Start();
        await unitOfWork.SaveChangesAsync(cancellationToken);

        var stopwatch = Stopwatch.StartNew();

        try
        {
            var exam = await data.Exams.FindAsync(job.ExamId, cancellationToken)
                ?? throw new InvalidOperationException("Exam disappeared before allocation started.");

            var halls = data.Halls.Query().Where(hall => hall.ExamId == job.ExamId).ToList();
            var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == job.ExamId).ToList();
            var institutions = data.Institutions.Query()
                .ToDictionary(institution => institution.Id, institution => institution.Name);

            if (candidates.Count == 0)
                throw new DomainException("There are no candidates to allocate.");

            var input = BuildInput(exam, halls, candidates, run.Strategy, run.Seed);

            var solver = new SeatAllocationSolver();

            var result = solver.Solve(
                input,
                new Progress<SolverProgress>(progress => run.ReportProgress(progress.Percent, progress.Phase, progress.BestViolationCount)),
                cancellationToken);

            stopwatch.Stop();

            var plan = SeatPlan.CreateDraft(run.TenantId, exam.Id, run.Id);

            foreach (var placement in result.Placements)
                plan.AddAssignment(placement.CandidateId, placement.HallId, placement.Row, placement.Column);

            plan.SetViolationCount(result.Violations.Count);

            await data.SeatPlans.AddAsync(plan, cancellationToken);

            run.Complete(
                plan.Id,
                result.Violations.Count,
                result.Metrics.HallsUsed,
                result.Metrics.CandidateCount,
                stopwatch.ElapsedMilliseconds);

            exam.MarkAllocated(plan.Id);

            await unitOfWork.SaveChangesAsync(cancellationToken);
        }
        catch (OperationCanceledException)
        {
            run.Cancel();
            await unitOfWork.SaveChangesAsync(CancellationToken.None);
        }
        catch (Exception exception)
        {
            run.Fail(exception.Message);
            await unitOfWork.SaveChangesAsync(CancellationToken.None);
        }
    }

    public static SolverInput BuildInput(
        Exam exam,
        IReadOnlyList<Hall> halls,
        IReadOnlyList<Candidate> candidates,
        AllocationStrategyKind strategy,
        int seed)
    {
        var solverHalls = halls
            .Select(hall => new SolverHall(
                hall.Id,
                hall.Name,
                hall.Layout.Rows,
                hall.Layout.Columns,
                hall.BlockedSeats.Select(seat => (seat.Row, seat.Column)).ToList()))
            .ToList();

        var solverCandidates = candidates
            .Select(candidate => new SolverCandidate(
                candidate.Id,
                candidate.InstitutionId,
                candidate.Roll,
                candidate.SubjectGroup))
            .ToList();

        return new SolverInput(solverCandidates, solverHalls, exam.Constraints, strategy, seed);
    }
}
