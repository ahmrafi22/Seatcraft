namespace SeatCraft.Domain.ValueObjects;

/// <summary>Rules the solver must honour when building a plan.</summary>
public sealed record AllocationConstraints
{
    public bool PreventSameInstitutionAdjacent { get; init; } = true;

    public bool KeepSubjectGroupContiguous { get; init; } = true;

    public bool MaintainRollOrder { get; init; } = true;

    public bool AllowHallSkipping { get; init; } = true;

    public static AllocationConstraints Default => new();
}
