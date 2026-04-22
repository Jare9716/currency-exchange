export type ErrorCode =
  | "user_not_found"
  | "invalid_credentials"
  | "user_blocked"
  | "unauthorized"
  | "validation_error"
  | "internal_error";

export class DomainError extends Error {
  constructor(
    public readonly code: ErrorCode,
    public readonly message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
  }
}
