namespace SeatCraft.Domain.Solver;

internal static class AllocationStateFactory
{
    public static AllocationState FromOutcome(SolverInput input, SeatGrid grid, AllocationOutcome outcome)
    {
        var state = new AllocationState(input, grid);

        for (var candidateIndex = 0; candidateIndex < outcome.SlotByCandidate.Length; candidateIndex++)
        {
            var slot = outcome.SlotByCandidate[candidateIndex];
            if (slot < 0)
                continue;

            state.ForceAssign(slot, candidateIndex, state.InstitutionOfCandidate(candidateIndex));
        }

        return state;
    }
}
