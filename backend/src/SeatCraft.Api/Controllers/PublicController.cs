using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using SeatCraft.Api.Infrastructure;
using SeatCraft.Application.Abstractions;
using SeatCraft.Application.Common;
using SeatCraft.Application.Contracts;
using SeatCraft.Domain.Enums;

namespace SeatCraft.Api.Controllers;

/// <summary>
/// Unauthenticated seat lookup for candidates. The tenant is explicit in the route
/// because anonymous callers carry no JWT claim. Roll + date of birth are both
/// required so the endpoint cannot be used to enumerate a roster.
/// </summary>
[Route("api/public/{tenantSlug}")]
[AllowAnonymous]
public sealed class PublicController(ISeatCraftData data) : ApiControllerBase
{
    private const string NotFoundMessage = "No seat was found for that roll and date of birth.";

    [HttpGet("seat-lookup")]
    [EnableRateLimiting("public-lookup")]
    [ProducesResponseType<PublicSeatLookupDto>(StatusCodes.Status200OK)]
    public async Task<IActionResult> SeatLookup(
        string tenantSlug,
        [FromQuery] string roll,
        [FromQuery] DateOnly dateOfBirth,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(roll))
            throw new ValidationFailedException("roll", "Roll is required.");

        var tenant = data.Tenants.Query()
            .FirstOrDefault(entry => entry.Slug == tenantSlug.Trim().ToLowerInvariant())
            ?? throw new NotFoundException(NotFoundMessage);

        // A tenant can hold the same roll across several exams, so only consider
        // candidates whose exam is currently published with an active plan.
        var publishedExamIds = data.Exams.QueryUnfiltered()
            .Where(entry => entry.TenantId == tenant.Id
                && entry.Status == ExamStatus.Published
                && entry.ActiveSeatPlanId != null)
            .Select(entry => entry.Id)
            .ToList();

        var candidate = data.Candidates.QueryUnfiltered()
            .Where(entry => entry.TenantId == tenant.Id
                && entry.Roll == roll.Trim()
                && publishedExamIds.Contains(entry.ExamId))
            .OrderByDescending(entry => entry.CreatedAt)
            .FirstOrDefault();

        if (candidate is null || candidate.DateOfBirth != dateOfBirth)
            throw new NotFoundException(NotFoundMessage);

        var exam = data.Exams.QueryUnfiltered()
            .FirstOrDefault(entry => entry.Id == candidate.ExamId && entry.TenantId == tenant.Id)
            ?? throw new NotFoundException(NotFoundMessage);

        if (exam.ActiveSeatPlanId is not { } activePlanId)
            throw new NotFoundException("Seat plans for this exam have not been published yet.");

        var plan = data.SeatPlans.QueryUnfiltered()
            .FirstOrDefault(entry => entry.Id == activePlanId && entry.TenantId == tenant.Id)
            ?? throw new NotFoundException("Seat plans for this exam have not been published yet.");

        var assignment = plan.Assignments.FirstOrDefault(entry => entry.CandidateId == candidate.Id)
            ?? throw new NotFoundException(NotFoundMessage);

        var hall = data.Halls.QueryUnfiltered()
            .FirstOrDefault(entry => entry.Id == assignment.HallId && entry.TenantId == tenant.Id);

        await Task.CompletedTask;

        return OkJson(new PublicSeatLookupDto(
            candidate.FullName,
            candidate.Roll,
            exam.Title,
            hall?.Name ?? "Hall",
            assignment.Label,
            plan.PublishedAt));
    }
}
