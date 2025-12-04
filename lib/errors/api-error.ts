/**
 * Custom API Error Classes
 * Provides standardized error types for the application
 */

export class ApiError extends Error {
    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly code?: string;

    constructor(
        message: string,
        statusCode: number = 500,
        isOperational: boolean = true,
        code?: string
    ) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;

        Object.setPrototypeOf(this, ApiError.prototype);
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends ApiError {
    constructor(message: string = "Validation failed", details?: any) {
        super(message, 400, true, "VALIDATION_ERROR");
        this.name = "ValidationError";
    }
}

export class AuthenticationError extends ApiError {
    constructor(message: string = "Authentication required") {
        super(message, 401, true, "AUTHENTICATION_ERROR");
        this.name = "AuthenticationError";
    }
}

export class AuthorizationError extends ApiError {
    constructor(message: string = "Insufficient permissions") {
        super(message, 403, true, "AUTHORIZATION_ERROR");
        this.name = "AuthorizationError";
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = "Resource not found") {
        super(message, 404, true, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class ConflictError extends ApiError {
    constructor(message: string = "Resource already exists") {
        super(message, 409, true, "CONFLICT");
        this.name = "ConflictError";
    }
}

export class RateLimitError extends ApiError {
    constructor(message: string = "Too many requests") {
        super(message, 429, true, "RATE_LIMIT_EXCEEDED");
        this.name = "RateLimitError";
    }
}

export class DatabaseError extends ApiError {
    constructor(message: string = "Database operation failed") {
        super(message, 500, true, "DATABASE_ERROR");
        this.name = "DatabaseError";
    }
}

export class ExternalServiceError extends ApiError {
    constructor(message: string = "External service error") {
        super(message, 502, true, "EXTERNAL_SERVICE_ERROR");
        this.name = "ExternalServiceError";
    }
}
