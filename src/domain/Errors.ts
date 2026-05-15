import { z } from "zod";

export const apiErrorSchema = z.object({
  status_code: z.number(),
  error_code: z.string(),
  detail: z.string(),
  hint: z.string().optional(),
});

export type ApiErrorData = z.infer<typeof apiErrorSchema>;

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly errorCode: string,
    public readonly detail: string,
    public readonly hint?: string
  ) {
    super(detail);
    this.name = "ApiError";
  }
}

export type ErrorCode =
  | "validation_error"
  | "internal_error"
  | "unauthorized";

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
