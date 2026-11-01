using System.Net;
using System.Net.Http.Json;
using SeatCraft.Api.Tests.Infrastructure;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Tests;

public sealed class AllocationFlowTests(SeatCraftApiFactory factory) : IClassFixture<SeatCraftApiFactory>
{
    private static async Task<(ApiClient Client, ExamDto Exam)> SeedExamAsync(SeatCraftApiFactory factory, string slug)
    {
        var client = new ApiClient(factory.CreateClient());
        await client.RegisterTenantAsync(slug, $"admin@{slug}.test");

        var exam = await client.CreateExamAsync("Admission Test");

        for (var i = 1; i <= 6; i++)
            await client.CreateInstitutionAsync($"College {i}", $"C{i}");

        await client.CreateHallAsync(exam.Id, "Hall A", 6, 6);
        await client.CreateHallAsync(exam.Id, "Hall B", 6, 6);

        var result = await client.ImportCandidatesAsync(exam.Id, ApiClient.CandidateCsv(60, 6));

        Assert.Equal(60, result.Imported);

        return (client, exam);
    }

    [Fact]
    public async Task Import_ReportsBadRows_WithoutRejectingWholeFile()
    {
        var client = new ApiClient(factory.CreateClient());
        await client.RegisterTenantAsync("import", "admin@import.test");
        var exam = await client.CreateExamAsync("Import exam");
        await client.CreateInstitutionAsync("Known College", "K1");

        var csv = "roll,name,institutionCode\n" +
                  "R1,Valid One,K1\n" +
                  "R2,Unknown College,ZZ\n" +
                  ",Missing Roll,K1\n" +
                  "R4,Valid Two,K1\n";

        var result = await client.ImportCandidatesAsync(exam.Id, csv);

        Assert.Equal(2, result.Imported);
        Assert.Equal(2, result.Errors.Count);
        Assert.Contains(result.Errors, error => error.Message.Contains("Unknown institution"));
    }

    [Fact]
    public async Task Run_ProducesCleanPlan()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-clean");

        var run = await client.StartRunAsync(exam.Id);
        var finished = await client.WaitForRunAsync(exam.Id, run.Id);

        Assert.Equal("Completed", finished.Status);
        Assert.Equal(60, finished.CandidateCount);
        Assert.NotNull(finished.ResultSeatPlanId);

        var plan = await client.GetPlanAsync(exam.Id, finished.ResultSeatPlanId!.Value);

        Assert.Equal(60, plan.Assignments.Count);
        Assert.Empty(plan.Violations);
    }

    [Fact]
    public async Task Run_IsIdempotent_ForSameKey()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-idempotent");

        var first = await client.StartRunAsync(exam.Id, idempotencyKey: "same-key");
        var finished = await client.WaitForRunAsync(exam.Id, first.Id);
        Assert.Equal("Completed", finished.Status);

        var second = await client.StartRunAsync(exam.Id, idempotencyKey: "same-key");

        Assert.Equal(first.Id, second.Id);
    }

    [Fact]
    public async Task ConcurrentStarts_NeverLeaveTwoActiveRuns()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-concurrent");

        var attempts = Enumerable.Range(0, 5)
            .Select(_ => client.Http.PostAsJsonAsync(
                $"/api/exams/{exam.Id}/allocation-runs",
                new StartAllocationRequest("Strict", 42)))
            .ToList();

        var responses = await Task.WhenAll(attempts);

        Assert.All(responses, response =>
            Assert.True(response.IsSuccessStatusCode || response.StatusCode == HttpStatusCode.Conflict));

        var runs = await client.Http.GetFromJsonAsync<List<AllocationRunDto>>($"/api/exams/{exam.Id}/allocation-runs");

        Assert.NotNull(runs);

        var active = runs!.Where(run => run.Status is "Queued" or "Running").ToList();

        Assert.True(active.Count <= 1, $"Expected at most one active run but found {active.Count}.");
    }

    [Fact]
    public async Task ConcurrentStarts_WithSameIdempotencyKey_ReturnOneRun()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-concurrent-key");

        var attempts = Enumerable.Range(0, 4)
            .Select(_ =>
            {
                var request = new HttpRequestMessage(HttpMethod.Post, $"/api/exams/{exam.Id}/allocation-runs")
                {
                    Content = JsonContent.Create(new StartAllocationRequest("Strict", 42))
                };

                request.Headers.Add("Idempotency-Key", "storm-key");

                return client.Http.SendAsync(request);
            })
            .ToList();

        var responses = await Task.WhenAll(attempts);

        var ids = new List<Guid>();

        foreach (var response in responses.Where(response => response.IsSuccessStatusCode))
        {
            var run = await response.Content.ReadFromJsonAsync<AllocationRunDto>();
            ids.Add(run!.Id);
        }

        Assert.NotEmpty(ids);
        Assert.Single(ids.Distinct());
    }

    [Fact]
    public async Task Publish_RequiresZeroBlockingViolations()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-publish");

        var run = await client.StartRunAsync(exam.Id);
        var finished = await client.WaitForRunAsync(exam.Id, run.Id);
        var planId = finished.ResultSeatPlanId!.Value;

        var published = await client.PublishAsync(exam.Id, planId);
        Assert.Equal(HttpStatusCode.OK, published.StatusCode);

        var plan = await client.GetPlanAsync(exam.Id, planId);
        Assert.Equal("Published", plan.Status);
    }

    [Fact]
    public async Task PublishedPlan_IsImmutable()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-immutable");

        var run = await client.StartRunAsync(exam.Id);
        var finished = await client.WaitForRunAsync(exam.Id, run.Id);
        var planId = finished.ResultSeatPlanId!.Value;

        await client.PublishAsync(exam.Id, planId);

        var plan = await client.GetPlanAsync(exam.Id, planId);
        var first = plan.Assignments[0].CandidateId;
        var second = plan.Assignments[1].CandidateId;

        var response = await client.SwapAsync(exam.Id, planId, first, second);

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task SeatLookup_RequiresMatchingDateOfBirth()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-lookup");

        var run = await client.StartRunAsync(exam.Id);
        var finished = await client.WaitForRunAsync(exam.Id, run.Id);
        await client.PublishAsync(exam.Id, finished.ResultSeatPlanId!.Value);

        var plan = await client.GetPlanAsync(exam.Id, finished.ResultSeatPlanId!.Value);
        var assignment = plan.Assignments.First(entry => entry.Roll == "R0001");

        var correct = await factory.CreateClient()
            .GetAsync($"/api/public/flow-lookup/seat-lookup?roll=R0001&dateOfBirth=2000-01-02");
        var wrong = await factory.CreateClient()
            .GetAsync($"/api/public/flow-lookup/seat-lookup?roll=R0001&dateOfBirth=1999-01-01");

        Assert.Equal(HttpStatusCode.OK, correct.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, wrong.StatusCode);

        var payload = await correct.Content.ReadFromJsonAsync<PublicSeatLookupDto>();
        Assert.Equal(assignment.SeatLabel, payload!.SeatLabel);
    }

    [Fact]
    public async Task SignedDownloadLink_ServesArchiveWithoutABearer()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-download");
        var run = await client.StartRunAsync(exam.Id);
        var finished = await client.WaitForRunAsync(exam.Id, run.Id);
        var planId = finished.ResultSeatPlanId!.Value;

        await client.PublishAsync(exam.Id, planId);

        var linkResponse = await client.Http.PostAsync(
            $"/api/exams/{exam.Id}/seat-plans/{planId}/documents/admit-cards/link",
            null);

        Assert.Equal(HttpStatusCode.OK, linkResponse.StatusCode);

        var link = await linkResponse.Content.ReadFromJsonAsync<DownloadLinkDto>();
        Assert.NotNull(link);

        var download = await factory.CreateClient().GetAsync(link!.Url);

        Assert.Equal(HttpStatusCode.OK, download.StatusCode);
        Assert.Equal("application/zip", download.Content.Headers.ContentType?.MediaType);

        var bytes = await download.Content.ReadAsByteArrayAsync();
        Assert.Equal("PK", System.Text.Encoding.ASCII.GetString(bytes, 0, 2));
    }

    [Fact]
    public async Task SignedDownloadLink_RejectsForgedToken()
    {
        var forged = await factory.CreateClient().GetAsync("/api/public/documents/forged-token");
        Assert.Equal(HttpStatusCode.NotFound, forged.StatusCode);
    }

    [Fact]
    public async Task SeatLookup_IsNotPublished_UntilPlanIsPublished()
    {
        var (client, exam) = await SeedExamAsync(factory, "flow-unpublished");

        var run = await client.StartRunAsync(exam.Id);
        await client.WaitForRunAsync(exam.Id, run.Id);

        var response = await factory.CreateClient()
            .GetAsync("/api/public/flow-unpublished/seat-lookup?roll=R0001&dateOfBirth=2000-01-02");

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    private sealed record DownloadLinkDto(string Url, DateTimeOffset ExpiresAt);
}
