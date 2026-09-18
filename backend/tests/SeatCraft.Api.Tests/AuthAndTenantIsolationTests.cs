using System.Net;
using System.Net.Http.Json;
using SeatCraft.Api.Tests.Infrastructure;
using SeatCraft.Application.Contracts;

namespace SeatCraft.Api.Tests;

public sealed class AuthAndTenantIsolationTests(SeatCraftApiFactory factory) : IClassFixture<SeatCraftApiFactory>
{
    [Fact]
    public async Task Register_ReturnsAdminToken()
    {
        var client = new ApiClient(factory.CreateClient());

        var auth = await client.RegisterTenantAsync("alpha", "admin@alpha.test");

        Assert.False(string.IsNullOrWhiteSpace(auth.AccessToken));
        Assert.Equal("Admin", auth.User.Role);
        Assert.Equal("admin@alpha.test", auth.User.Email);
    }

    [Fact]
    public async Task Register_RejectsDuplicateSlug()
    {
        var client = new ApiClient(factory.CreateClient());
        await client.RegisterTenantAsync("dupe", "first@dupe.test");

        var response = await client.Http.PostAsJsonAsync("/api/auth/register",
            new RegisterRequest("Dupe Two", "dupe", "second@dupe.test", "Passw0rd!123", "Admin"));

        Assert.Equal(HttpStatusCode.Conflict, response.StatusCode);
    }

    [Fact]
    public async Task Login_WithWrongPassword_IsRejected()
    {
        var client = new ApiClient(factory.CreateClient());
        await client.RegisterTenantAsync("login", "admin@login.test");

        var response = await client.Http.PostAsJsonAsync("/api/auth/login",
            new LoginRequest("admin@login.test", "wrong-password"));

        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Anonymous_Request_IsRejected()
    {
        var client = factory.CreateClient();

        var response = await client.GetAsync("/api/exams");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task Tenant_CannotReadAnotherTenantsExam()
    {
        var owner = new ApiClient(factory.CreateClient());
        await owner.RegisterTenantAsync("owner", "owner@isolation.test");
        var exam = await owner.CreateExamAsync("Owner exam");

        var intruder = new ApiClient(factory.CreateClient());
        await intruder.RegisterTenantAsync("intruder", "intruder@isolation.test");

        var examResponse = await intruder.Http.GetAsync($"/api/exams/{exam.Id}");
        var candidatesResponse = await intruder.Http.GetAsync($"/api/exams/{exam.Id}/candidates");
        var hallsResponse = await intruder.Http.GetAsync($"/api/exams/{exam.Id}/halls");

        Assert.Equal(HttpStatusCode.NotFound, examResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, candidatesResponse.StatusCode);
        Assert.Equal(HttpStatusCode.NotFound, hallsResponse.StatusCode);
    }

    [Fact]
    public async Task Tenant_List_OnlyReturnsOwnExams()
    {
        var owner = new ApiClient(factory.CreateClient());
        await owner.RegisterTenantAsync("list-owner", "owner@list.test");
        await owner.CreateExamAsync("Private exam");

        var other = new ApiClient(factory.CreateClient());
        await other.RegisterTenantAsync("list-other", "other@list.test");

        var exams = await other.Http.GetFromJsonAsync<List<ExamDto>>("/api/exams");

        Assert.NotNull(exams);
        Assert.DoesNotContain(exams!, exam => exam.Title == "Private exam");
    }
}
