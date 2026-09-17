using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Entities;

namespace SeatCraft.Application.Institutions;

public sealed class InstitutionService(ISeatCraftData data, IUnitOfWork unitOfWork, ICurrentUser currentUser)
{
    public IReadOnlyList<InstitutionDto> List()
    {
        return data.Institutions.Query()
            .OrderBy(institution => institution.Name)
            .ToList()
            .Select(ToDto)
            .ToList();
    }

    public async Task<InstitutionDto> CreateAsync(CreateInstitutionRequest request, CancellationToken cancellationToken = default)
    {
        var code = request.Code.Trim().ToUpperInvariant();

        if (data.Institutions.Query().Any(institution => institution.Code == code))
            throw new ConflictException($"Institution code '{code}' already exists.");
        var institution = Institution.Create(currentUser.RequireTenantId(), request.Name, code);

        await data.Institutions.AddAsync(institution, cancellationToken);
        await unitOfWork.SaveChangesAsync(cancellationToken);

        return ToDto(institution);
    }

    public async Task DeleteAsync(Guid id, CancellationToken cancellationToken = default)
    {
        var institution = await data.Institutions.FindAsync(id, cancellationToken)
            ?? throw new NotFoundException($"Institution {id} was not found.");

        if (data.Candidates.Query().Any(candidate => candidate.InstitutionId == id))
            throw new ConflictException("Cannot delete an institution that still has candidates.");

        data.Institutions.Remove(institution);
        await unitOfWork.SaveChangesAsync(cancellationToken);
    }

    private static InstitutionDto ToDto(Institution institution) =>
        new(institution.Id, institution.Name, institution.Code, institution.CandidateCount);
}
