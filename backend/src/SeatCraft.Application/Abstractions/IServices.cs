using SeatCraft.Domain.Solver;

namespace SeatCraft.Application.Abstractions;

public sealed record AllocationJob(Guid TenantId, Guid ExamId, Guid RunId, int Seed);

/// <summary>Queues allocation work so the HTTP request never blocks on the solver.</summary>
public interface IAllocationQueue
{
    ValueTask EnqueueAsync(AllocationJob job, CancellationToken cancellationToken = default);

    ValueTask<AllocationJob> DequeueAsync(CancellationToken cancellationToken);
}

public sealed record PdfDocument(string FileName, byte[] Content);

public interface IAdmitCardGenerator
{
    PdfDocument Generate(AdmitCardModel model);
}

public sealed record AdmitCardModel(
    string ExamTitle,
    string CandidateName,
    string Roll,
    string Institution,
    string SubjectGroup,
    string HallName,
    string SeatLabel,
    DateTimeOffset ExamDate,
    string? PhotoUrl,
    string? ExamDateLabel = null,
    string? HallAddress = null,
    int? SeatRow = null,
    int? SeatColumn = null,
    string? TenantName = null,
    string? ExamDescription = null);
public interface IAttendanceSheetGenerator
{
    PdfDocument Generate(AttendanceSheetModel model);
}

public sealed record AttendanceSheetModel(
    string ExamTitle,
    string HallName,
    DateTimeOffset ExamDate,
    IReadOnlyList<AttendanceRow> Rows);

public sealed record AttendanceRow(int Serial, string Roll, string CandidateName, string Institution, string SeatLabel);
