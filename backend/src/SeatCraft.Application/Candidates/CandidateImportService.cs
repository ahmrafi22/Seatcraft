using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Application.Candidates;

public sealed class CandidateImportService(ISeatCraftData data, IUnitOfWork unitOfWork, ICurrentUser currentUser)
{
    /// <summary>
    /// Imports candidates from CSV. Rows are validated individually so one bad line
    /// does not discard the whole file; errors come back with their line numbers.
    /// </summary>
    public async Task<CandidateImportResult> ImportAsync(
        Guid examId,
        Stream csv,
        CancellationToken cancellationToken = default)
    {
        if (await data.Exams.FindAsync(examId, cancellationToken) is null)
            throw new NotFoundException($"Exam {examId} was not found.");

        using var reader = new StreamReader(csv);
        var institutions = data.Institutions.Query()
            .ToDictionary(institution => institution.Code, institution => institution.Id, StringComparer.OrdinalIgnoreCase);

        var existingRolls = data.Candidates.Query()
            .Where(candidate => candidate.ExamId == examId)
            .Select(candidate => candidate.Roll)
            .ToHashSet(StringComparer.Ordinal);

        var errors = new List<CandidateImportError>();
        var imported = new List<Candidate>();
        var lineNumber = 0;

        var header = await reader.ReadLineAsync(cancellationToken);
        lineNumber++;

        if (header is null)
            throw new ValidationFailedException("file", "The uploaded file is empty.");

        var columns = header.Split(',').Select(column => column.Trim().ToLowerInvariant()).ToArray();
        var rollIndex = Array.IndexOf(columns, "roll");
        var nameIndex = Array.IndexOf(columns, "name");
        var institutionIndex = Array.IndexOf(columns, "institutioncode");
        var groupIndex = Array.IndexOf(columns, "subjectgroup");
        var dobIndex = Array.IndexOf(columns, "dateofbirth");

        if (rollIndex < 0 || nameIndex < 0 || institutionIndex < 0)
        {
            throw new ValidationFailedException(
                "file",
                "The header row must contain roll, name and institutionCode columns.");
        }

        string? line;

        while ((line = await reader.ReadLineAsync(cancellationToken)) is not null)
        {
            lineNumber++;

            if (string.IsNullOrWhiteSpace(line))
                continue;

            var cells = line.Split(',');

            if (cells.Length <= Math.Max(rollIndex, Math.Max(nameIndex, institutionIndex)))
            {
                errors.Add(new CandidateImportError(lineNumber, "Row does not have enough columns."));
                continue;
            }

            var roll = cells[rollIndex].Trim();
            var name = cells[nameIndex].Trim();
            var institutionCode = cells[institutionIndex].Trim();

            if (string.IsNullOrWhiteSpace(roll) || string.IsNullOrWhiteSpace(name))
            {
                errors.Add(new CandidateImportError(lineNumber, "Roll and name are required."));
                continue;
            }

            if (!institutions.TryGetValue(institutionCode, out var institutionId))
            {
                errors.Add(new CandidateImportError(lineNumber, $"Unknown institution code '{institutionCode}'."));
                continue;
            }

            if (!existingRolls.Add(roll))
            {
                errors.Add(new CandidateImportError(lineNumber, $"Roll '{roll}' already exists for this exam."));
                continue;
            }

            var subjectGroup = groupIndex >= 0 && groupIndex < cells.Length && !string.IsNullOrWhiteSpace(cells[groupIndex])
                ? cells[groupIndex].Trim()
                : "General";

            DateOnly? dateOfBirth = null;

            if (dobIndex >= 0 && dobIndex < cells.Length && !string.IsNullOrWhiteSpace(cells[dobIndex]))
            {
                if (!DateOnly.TryParse(cells[dobIndex].Trim(), out var parsed))
                {
                    errors.Add(new CandidateImportError(lineNumber, $"Date of birth '{cells[dobIndex]}' is not a valid date."));
                    continue;
                }

                dateOfBirth = parsed;
            }

            imported.Add(Candidate.Create(currentUser.RequireTenantId(), examId, institutionId, roll, name, subjectGroup, dateOfBirth));
        }

        if (imported.Count > 0)
        {
            await data.Candidates.AddRangeAsync(imported, cancellationToken);
            await unitOfWork.SaveChangesAsync(cancellationToken);

            foreach (var institutionId in imported.Select(candidate => candidate.InstitutionId).Distinct())
                await RefreshCountAsync(institutionId, cancellationToken);
        }

        return new CandidateImportResult(imported.Count, errors.Count, errors);
    }

    private async Task RefreshCountAsync(Guid institutionId, CancellationToken cancellationToken)
    {
        var institution = await data.Institutions.FindAsync(institutionId, cancellationToken);
        if (institution is null)
            return;

        institution.SetCandidateCount(data.Candidates.Query().Count(candidate => candidate.InstitutionId == institutionId));
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }
}
