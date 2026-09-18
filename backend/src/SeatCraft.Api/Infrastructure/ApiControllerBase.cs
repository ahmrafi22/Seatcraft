using System.Text.Json;
using Microsoft.AspNetCore.Mvc;

namespace SeatCraft.Api.Infrastructure;

public static class ApiJson
{
    public static readonly JsonSerializerOptions Options = new(JsonSerializerDefaults.Web)
    {
        DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull,
        Converters = { new System.Text.Json.Serialization.JsonStringEnumConverter() }
    };
}

/// <summary>Base controller that keeps JSON options identical across every endpoint.</summary>
[ApiController]
public abstract class ApiControllerBase : ControllerBase
{
    protected IActionResult OkJson<T>(T value) => new JsonResult(value, ApiJson.Options);
}
