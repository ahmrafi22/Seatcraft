using Microsoft.AspNetCore.Mvc;
using SeatCraft.Application.Common;
using SeatCraft.Domain.Common;

namespace SeatCraft.Api.Middleware;

/// <summary>Maps application and domain exceptions to RFC-7807 problem responses.</summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            await HandleAsync(context, exception);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        if (context.Response.HasStarted)
        {
            logger.LogError(exception, "Response already started; cannot write problem details");
            return;
        }

        var (status, title) = exception switch
        {
            NotFoundException => (StatusCodes.Status404NotFound, "Not found"),
            ConflictException => (StatusCodes.Status409Conflict, "Conflict"),
            ForbiddenException => (StatusCodes.Status403Forbidden, "Forbidden"),
            DomainException => (StatusCodes.Status400BadRequest, "Invalid operation"),
            ValidationFailedException => (StatusCodes.Status400BadRequest, "Validation failed"),
            UniqueConstraintViolationException => (StatusCodes.Status409Conflict, "Conflict"),
            _ => (StatusCodes.Status500InternalServerError, "Unexpected error")
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Unhandled exception for {Path}", context.Request.Path);
        else
            logger.LogInformation("{Status} for {Path}: {Message}", status, context.Request.Path, exception.Message);
        var problem = new ProblemDetails
        {
            Status = status,
            Title = title,
            Detail = exception.Message,
            Instance = context.Request.Path
        };

        if (exception is ValidationFailedException validation)
            problem.Extensions["errors"] = validation.Errors;

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        await context.Response.WriteAsJsonAsync(problem);
    }
}
