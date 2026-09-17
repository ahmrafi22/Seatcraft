namespace SeatCraft.Application.Common;

public class NotFoundException(string message) : Exception(message);

public class ConflictException(string message) : Exception(message);

public class ForbiddenException(string message) : Exception(message);

public class ValidationFailedException(IReadOnlyDictionary<string, string[]> errors)
    : Exception("One or more validation errors occurred.")
{
    public IReadOnlyDictionary<string, string[]> Errors { get; } = errors;

    public ValidationFailedException(string field, string message)
        : this(new Dictionary<string, string[]> { [field] = [message] })
    {
    }
}

/// <summary>Raised when a database unique constraint rejects a write.</summary>
public class UniqueConstraintViolationException(string message, Exception? inner = null) : Exception(message, inner);
