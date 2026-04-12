export type ErrorCode =
  | "DATABASE_ERROR"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "AI_SERVICE_ERROR"
  | "UNAUTHORIZED"
  | "UNKNOWN_ERROR";

export interface ErrorDetails {
  code: ErrorCode;
  message: string;
  statusCode: number;
  context?: Record<string, unknown>;
}

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly context?: Record<string, unknown>;

  constructor(details: ErrorDetails) {
    super(details.message);
    this.name = "AppError";
    this.code = details.code;
    this.statusCode = details.statusCode;
    this.context = details.context;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
    };
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: "DATABASE_ERROR",
      message,
      statusCode: 503,
      context,
    });
    this.name = "DatabaseError";
  }
}

export class ValidationError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: "VALIDATION_ERROR",
      message,
      statusCode: 400,
      context,
    });
    this.name = "ValidationError";
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier: string) {
    super({
      code: "NOT_FOUND",
      message: `${resource} no encontrado: ${identifier}`,
      statusCode: 404,
      context: { resource, identifier },
    });
    this.name = "NotFoundError";
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: "AI_SERVICE_ERROR",
      message,
      statusCode: 502,
      context,
    });
    this.name = "AIServiceError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super({
      code: "UNAUTHORIZED",
      message,
      statusCode: 401,
      context,
    });
    this.name = "UnauthorizedError";
  }
}
