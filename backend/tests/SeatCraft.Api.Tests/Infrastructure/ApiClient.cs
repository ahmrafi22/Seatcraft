using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Tests.Infrastructure;

/// <summary>Thin client that keeps a tenant's token and hides JSON plumbing.</summary>
public sealed class ApiClient(HttpClient client)
{
    public HttpClient Http { get; } = client;

    public async Task<AuthResponse> RegisterTenantAsync(string slug, string email)
    {
        var response = await Http.PostAsJsonAsync("/api/auth/register", new RegisterRequest(
            $"Tenant {slug}", slug, email, "Passw0rd!123", "Admin"));

        response.EnsureSuccessStatusCode();

        var auth = await response.Content.ReadFromJsonAsync<AuthResponse>()
            ?? throw new InvalidOperationException("Registration returned no body.");

        Http.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", auth.AccessToken);

        return auth;
    }

    public async Task<ExamDto> CreateExamAsync(string title)
    {
        var response = await Http.PostAsJsonAsync("/api/exams", new CreateExamRequest(title, "integration test"));

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<ExamDto>()
            ?? throw new InvalidOperationException("Exam creation returned no body.");
    }

    public async Task<InstitutionDto> CreateInstitutionAsync(string name, string code)
    {
        var response = await Http.PostAsJsonAsync("/api/institutions", new CreateInstitutionRequest(name, code));

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<InstitutionDto>()
            ?? throw new InvalidOperationException("Institution creation returned no body.");
    }

    public async Task<HallDto> CreateHallAsync(Guid examId, string name, int rows, int columns)
    {
        var response = await Http.PostAsJsonAsync($"/api/exams/{examId}/halls", new CreateHallRequest(name, rows, columns));

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<HallDto>()
            ?? throw new InvalidOperationException("Hall creation returned no body.");
    }

    public async Task<CandidateImportResult> ImportCandidatesAsync(Guid examId, string csv)
    {
        using var content = new MultipartFormDataContent();
        using var file = new ByteArrayContent(Encoding.UTF8.GetBytes(csv));

        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        content.Add(file, "file", "candidates.csv");

        var response = await Http.PostAsync($"/api/exams/{examId}/candidates/import", content);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<CandidateImportResult>()
            ?? throw new InvalidOperationException("Import returned no body.");
    }

    public async Task<AllocationRunDto> StartRunAsync(Guid examId, string strategy = "Strict", int seed = 42, string? idempotencyKey = null)
    {
        using var request = new HttpRequestMessage(HttpMethod.Post, $"/api/exams/{examId}/allocation-runs")
        {
            Content = JsonContent.Create(new StartAllocationRequest(strategy, seed))
        };

        if (idempotencyKey is not null)
            request.Headers.Add("Idempotency-Key", idempotencyKey);

        var response = await Http.SendAsync(request);

        response.EnsureSuccessStatusCode();

        return await response.Content.ReadFromJsonAsync<AllocationRunDto>()
            ?? throw new InvalidOperationException("Run start returned no body.");
    }

    public async Task<AllocationRunDto> WaitForRunAsync(Guid examId, Guid runId, int attempts = 60)
    {
        for (var attempt = 0; attempt < attempts; attempt++)
        {
            var run = await Http.GetFromJsonAsync<AllocationRunDto>($"/api/exams/{examId}/allocation-runs/{runId}")
                ?? throw new InvalidOperationException("Run lookup returned no body.");

            if (run.Status is "Completed" or "Failed" or "Cancelled")
                return run;

            await Task.Delay(100);
        }

        throw new TimeoutException($"Allocation run {runId} did not finish in time.");
    }

    public async Task<SeatPlanDetailDto> GetPlanAsync(Guid examId, Guid planId) =>
        await Http.GetFromJsonAsync<SeatPlanDetailDto>($"/api/exams/{examId}/seat-plans/{planId}")
        ?? throw new InvalidOperationException("Plan lookup returned no body.");

    public async Task<HttpResponseMessage> SwapAsync(Guid examId, Guid planId, Guid first, Guid second, bool force = false) =>
        await Http.PostAsJsonAsync(
            $"/api/exams/{examId}/seat-plans/{planId}/swap?force={force}",
            new SwapSeatsRequest(first, second));

    public async Task<HttpResponseMessage> PublishAsync(Guid examId, Guid planId) =>
        await Http.PostAsync($"/api/exams/{examId}/seat-plans/{planId}/publish", null);

    public static string CandidateCsv(int count, int institutionCount)
    {
        var builder = new StringBuilder("roll,name,institutionCode,subjectGroup,dateOfBirth\n");

        for (var i = 1; i <= count; i++)
            builder.AppendLine($"R{i:D4},Candidate {i},C{(i % institutionCount) + 1},Science,2000-01-{((i % 28) + 1):D2}");

        return builder.ToString();
    }
}
