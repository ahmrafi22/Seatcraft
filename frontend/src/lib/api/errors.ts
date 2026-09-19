/** RFC 7807 problem details, as produced by ExceptionHandlingMiddleware. */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  errors?: Record<string, string[]>;
}

export class ApiError extends Error {
  readonly status: number;
  readonly problem: ProblemDetails | null;

  constructor(status: number, message: string, problem: ProblemDetails | null = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.problem = problem;
  }

  /** Validation errors flattened to a single readable sentence. */
  get detail(): string {
    if (this.problem?.errors) {
      const first = Object.entries(this.problem.errors)[0];
      if (first) return `${first[0]}: ${first[1].join(" ")}`;
    }
    return this.problem?.detail ?? this.message;
  }
}
