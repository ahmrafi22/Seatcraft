namespace SeatCraft.Domain.Tests.Solver;

/// <summary>Collects progress synchronously so assertions see every report.</summary>
public sealed class RecordingProgress<T> : IProgress<T>
{
    public List<T> Reports { get; } = [];

    public void Report(T value) => Reports.Add(value);
}
