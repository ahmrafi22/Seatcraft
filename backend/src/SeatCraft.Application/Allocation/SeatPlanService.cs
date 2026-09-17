using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;
using SeatCraft.Domain.Enums;
using SeatCraft.Domain.Solver;
using SeatCraft.Domain.ValueObjects;

namespace SeatCraft.Application.Allocation;

public sealed class SeatPlanService(
    ISeatCraftData data,
    IUnitOfWork unitOfWork,
    ICurrentUser currentUser,
    IPlanCache planCache)
{
    public async Task<SeatPlanDetailDto> GetAsync(Guid examId, Guid planId, CancellationToken cancellationToken = default)
    {
        var plan = await LoadAsync(examId, planId, cancellationToken);
        var exam = await data.Exams.FindAsync(examId, cancellationToken)
            ?? throw new NotFoundException($"Exam {examId} was not found.");

        var assignments = await BuildAssignmentsAsync(plan, cancellationToken);
        var violations = Validate(exam, assignments);

        return new SeatPlanDetailDto(
            plan.Id,
            plan.ExamId,
            plan.Status.ToString(),
            plan.ViolationCount,
            plan.PublishedAt,
            assignments,
            violations);
    }

    public async Task<SeatPlanDto> PublishAsync(Guid examId, Guid planId, CancellationToken cancellationToken = default)
    {
        if (!currentUser.IsAdmin)
            throw new ForbiddenException("Only an admin can publish a seat plan.");

        var plan = await LoadAsync(examId, planId, cancellationToken);
        var exam = await data.Exams.FindAsync(examId, cancellationToken)
            ?? throw new NotFoundException($"Exam {examId} was not found.");

        var assignments = await BuildAssignmentsAsync(plan, cancellationToken);
        var violations = Validate(exam, assignments);

        if (violations.Any(violation => violation.Kind != nameof(ViolationKind.RollOrderBroken)))
            throw new ConflictException("The plan still has blocking violations. Resolve them before publishing.");

        var previous = data.SeatPlans.Query()
            .Where(candidate => candidate.ExamId == examId && candidate.Status == SeatPlanStatus.Published)
            .ToList();

        foreach (var superseded in previous)
            superseded.Supersede();

        plan.SetViolationCount(violations.Count);
        plan.Publish();

        exam.MarkPublished(plan.Id);

        await data.AuditEntries.AddAsync(
            AuditEntry.Record(plan.TenantId, examId, currentUser.UserId, "seat-plan.published", $"Plan {plan.Id} published."),
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await planCache.RemoveAsync(CacheKey(examId), cancellationToken);

        return ToDto(plan);
    }

    public async Task<OverrideResultDto> SwapAsync(
        Guid examId,
        Guid planId,
        SwapSeatsRequest request,
        bool force = false,
        string? reason = null,
        CancellationToken cancellationToken = default)
    {
        var (plan, exam, assignments) = await LoadEditableAsync(examId, planId, cancellationToken);

        var first = assignments.FirstOrDefault(a => a.CandidateId == request.FirstCandidateId)
            ?? throw new NotFoundException("The first candidate has no seat in this plan.");

        var second = assignments.FirstOrDefault(a => a.CandidateId == request.SecondCandidateId)
            ?? throw new NotFoundException("The second candidate has no seat in this plan.");

        var updated = assignments
            .Select(assignment => assignment.CandidateId == first.CandidateId
                ? assignment with { Row = second.Row, Column = second.Column }
                : assignment.CandidateId == second.CandidateId
                    ? assignment with { Row = first.Row, Column = first.Column }
                    : assignment)
            .ToList();

        return await ApplyOverrideAsync(plan, exam, updated, "seat-plan.swapped", force, reason, cancellationToken);
    }

    public async Task<OverrideResultDto> MoveAsync(
        Guid examId,
        Guid planId,
        MoveCandidateRequest request,
        bool force = false,
        CancellationToken cancellationToken = default)
    {
        var (plan, exam, assignments) = await LoadEditableAsync(examId, planId, cancellationToken);

        var halls = data.Halls.Query().Where(hall => hall.ExamId == examId).ToList();
        var hall = halls.FirstOrDefault(candidate => candidate.Id == request.HallId)
            ?? throw new NotFoundException($"Hall {request.HallId} was not found for this exam.");

        if (!hall.IsSeatUsable(request.Row, request.Column))
            throw new ValidationFailedException("seat", "That seat is outside the hall layout or blocked.");

        if (assignments.Any(a => a.HallId == request.HallId && a.Row == request.Row && a.Column == request.Column && a.CandidateId != request.CandidateId))
            throw new ConflictException("That seat is already occupied. Swap the two candidates instead.");

        var updated = assignments
            .Select(assignment => assignment.CandidateId == request.CandidateId
                ? assignment with { HallId = request.HallId, HallName = hall.Name, Row = request.Row, Column = request.Column, SeatLabel = $"R{request.Row + 1}-C{request.Column + 1}" }
                : assignment)
            .ToList();

        return await ApplyOverrideAsync(plan, exam, updated, "seat-plan.moved", force, request.Reason, cancellationToken);
    }

    public async Task<IReadOnlyList<PlanViolationDto>> RevalidateAsync(Guid examId, Guid planId, CancellationToken cancellationToken = default)
    {
        var detail = await GetAsync(examId, planId, cancellationToken);

        return detail.Violations;
    }

    public async Task DeleteAsync(Guid examId, Guid planId, CancellationToken cancellationToken = default)
    {
        var plan = await LoadAsync(examId, planId, cancellationToken);

        if (plan.Status == SeatPlanStatus.Published)
            throw new ConflictException("A published plan cannot be deleted.");

        data.SeatPlans.Remove(plan);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    public static string CacheKey(Guid examId) => $"seat-plan:published:{examId}";

    private async Task<OverrideResultDto> ApplyOverrideAsync(
        SeatPlan plan,
        Exam exam,
        IReadOnlyList<SeatAssignmentDto> assignments,
        string action,
        bool force,
        string? reason,
        CancellationToken cancellationToken)
    {
        var violations = Validate(exam, assignments);
        var blocking = violations.Where(violation => violation.Kind != nameof(ViolationKind.RollOrderBroken)).ToList();

        if (blocking.Count > 0 && !force)
            return new OverrideResultDto(false, blocking.Count, violations, false);

        if (blocking.Count > 0 && string.IsNullOrWhiteSpace(reason))
            throw new ValidationFailedException("reason", "A reason is required when saving a plan that breaks a rule.");

        plan.ReplaceAssignments(assignments.Select(a => (a.CandidateId, a.HallId, a.Row, a.Column)));
        plan.SetViolationCount(violations.Count);

        await data.AuditEntries.AddAsync(
            AuditEntry.Record(
                plan.TenantId,
                exam.Id,
                currentUser.UserId,
                action,
                $"{assignments.Count} assignments; {violations.Count} violations.",
                isForced: blocking.Count > 0,
                reason: reason),
            cancellationToken);

        await unitOfWork.SaveChangesAsync(cancellationToken);
        await planCache.RemoveAsync(CacheKey(exam.Id), cancellationToken);

        return new OverrideResultDto(true, violations.Count, violations, blocking.Count > 0);
    }

    private IReadOnlyList<PlanViolationDto> Validate(Exam exam, IReadOnlyList<SeatAssignmentDto> assignments)
    {
        var halls = data.Halls.Query().Where(hall => hall.ExamId == exam.Id).ToList();
        var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == exam.Id).ToList();

        var solverHalls = halls
            .Select(hall => new SolverHall(hall.Id, hall.Name, hall.Layout.Rows, hall.Layout.Columns,
                hall.BlockedSeats.Select(seat => (seat.Row, seat.Column)).ToList()))
            .ToList();

        var solverCandidates = candidates
            .Select(candidate => new SolverCandidate(candidate.Id, candidate.InstitutionId, candidate.Roll, candidate.SubjectGroup))
            .ToList();

        var grid = SeatGrid.Build(solverHalls);
        var placements = assignments
            .Select(a => new SeatPlacement(a.CandidateId, a.HallId, a.Row, a.Column))
            .ToList();

        var violations = PlanValidator.Validate(solverCandidates, placements, grid, exam.Constraints);

        return violations
            .Select(violation => new PlanViolationDto(
                violation.Kind.ToString(),
                violation.Message,
                violation.CandidateId,
                violation.OtherCandidateId))
            .ToList();
    }

    private async Task<List<SeatAssignmentDto>> BuildAssignmentsAsync(SeatPlan plan, CancellationToken cancellationToken)
    {
        var examId = plan.ExamId;

        var halls = data.Halls.Query().Where(hall => hall.ExamId == examId).ToList();
        var candidates = data.Candidates.Query().Where(candidate => candidate.ExamId == examId).ToList();
        var institutions = data.Institutions.Query().ToList();

        var hallNames = halls.ToDictionary(hall => hall.Id, hall => hall.Name);
        var institutionNames = institutions.ToDictionary(institution => institution.Id, institution => institution.Name);
        var candidateById = candidates.ToDictionary(candidate => candidate.Id);

        await Task.CompletedTask;

        return plan.Assignments
            .Where(assignment => candidateById.ContainsKey(assignment.CandidateId))
            .Select(assignment =>
            {
                var candidate = candidateById[assignment.CandidateId];

                return new SeatAssignmentDto(
                    candidate.Id,
                    candidate.Roll,
                    candidate.FullName,
                    candidate.InstitutionId,
                    institutionNames.GetValueOrDefault(candidate.InstitutionId, string.Empty),
                    assignment.HallId,
                    hallNames.GetValueOrDefault(assignment.HallId, string.Empty),
                    assignment.Row,
                    assignment.Column,
                    assignment.Label);
            })
            .OrderBy(assignment => assignment.HallName)
            .ThenBy(assignment => assignment.Row)
            .ThenBy(assignment => assignment.Column)
            .ToList();
    }

    private async Task<(SeatPlan Plan, Exam Exam, IReadOnlyList<SeatAssignmentDto> Assignments)> LoadEditableAsync(
        Guid examId,
        Guid planId,
        CancellationToken cancellationToken)
    {
        var plan = await LoadAsync(examId, planId, cancellationToken);

        if (plan.Status == SeatPlanStatus.Published)
            throw new ConflictException("A published plan is immutable. Unpublish or create a new run first.");

        var exam = await data.Exams.FindAsync(examId, cancellationToken)
            ?? throw new NotFoundException($"Exam {examId} was not found.");

        var assignments = await BuildAssignmentsAsync(plan, cancellationToken);

        return (plan, exam, assignments);
    }

    private async Task<SeatPlan> LoadAsync(Guid examId, Guid planId, CancellationToken cancellationToken)
    {
        var plan = await data.SeatPlans.FindAsync(planId, cancellationToken);

        if (plan is null || plan.ExamId != examId)
            throw new NotFoundException($"Seat plan {planId} was not found.");

        return plan;
    }

    private static SeatPlanDto ToDto(SeatPlan plan) => new(
        plan.Id,
        plan.ExamId,
        plan.AllocationRunId,
        plan.Status.ToString(),
        plan.ViolationCount,
        plan.PublishedAt,
        plan.Assignments.Count,
        new PlanMetricsDto(plan.Assignments.Select(a => a.HallId).Distinct().Count(), plan.ViolationCount, 0, 0, 0));
}
