namespace SeatCraft.Domain.Solver;

public sealed record SolverProgress(int Percent, string Phase, int BestViolationCount);
