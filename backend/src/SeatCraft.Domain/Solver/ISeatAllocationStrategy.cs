namespace SeatCraft.Domain.Solver;

/// <summary>Candidate index to slot index mapping, where -1 means unassigned.</summary>
public sealed record AllocationOutcome(int[] SlotByCandidate, bool IsOptimal);

public interface ISeatAllocationStrategy
{
    string Name { get; }

    AllocationOutcome Allocate(
        SolverInput input,
        SeatGrid grid,
        IProgress<SolverProgress>? progress,
        CancellationToken cancellationToken);
}
