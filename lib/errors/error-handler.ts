/**
 * Centralized Error Handler
 * Handles all API errors consistently with production-safe responses
 */

import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiError } from "./api-error";
import { logger } from "../logger";

interface ErrorResponse {
    error: string;
    code?: string;
    details?: any;
    timestamp: string;
}

export function handleError(error: unknown, context?: Record<string, any>): NextResponse {
    const timestamp = new Date().toISOString();

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        const validationErrors = error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));

        logger.warn('Validation error', {
            ...context,
            validationErrors,
        });

        return NextResponse.json(
            {
                error: "Validation failed",
                code: "VALIDATION_ERROR",
                details: validationErrors,
                timestamp,
            } as ErrorResponse,
            { status: 400 }
        );
    }

    // Handle custom API errors
    if (error instanceof ApiError) {
        logger.error(error.message, error, {
            ...context,
            code: error.code,
            statusCode: error.statusCode,
        });

        const response: ErrorResponse = {
            error: error.message,
            code: error.code,
            timestamp,
        };

        // Only include stack in development
        if (process.env.NODE_ENV === 'development') {
            response.details = { stack: error.stack };
        }

        return NextResponse.json(response, { status: error.statusCode });
    }

    // Handle MongoDB duplicate key errors
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
        const mongoError = error as any;
        const field = Object.keys(mongoError.keyPattern || {})[0] || 'field';

        logger.warn('Duplicate key error', {
            ...context,
            field,
        });

        return NextResponse.json(
            {
                error: `${field} already exists`,
                code: "DUPLICATE_KEY",
                timestamp,
            } as ErrorResponse,
            { status: 409 }
        );
    }

    // Handle unknown errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorStack = error instanceof Error ? error.stack : undefined;

    logger.error('Unhandled error', error instanceof Error ? error : new Error(String(error)), {
        ...context,
        errorType: error?.constructor?.name,
    });

    // Production-safe error response (no sensitive data)
    const response: ErrorResponse = {
        error: process.env.NODE_ENV === 'production'
            ? 'An unexpected error occurred. Please try again later.'
            : errorMessage,
        code: "INTERNAL_ERROR",
        timestamp,
    };

    // Include details only in development
    if (process.env.NODE_ENV === 'development') {
        response.details = {
            message: errorMessage,
            stack: errorStack,
        };
    }

    return NextResponse.json(response, { status: 500 });
}

/**
 * Async error wrapper for API route handlers
 * Ensures all errors are caught and handled consistently
 */
export function withErrorHandler<T extends any[], R>(
    handler: (...args: T) => Promise<R>,
    context?: Record<string, any>
): (...args: T) => Promise<R | NextResponse> {
    return async (...args: T) => {
        try {
            return await handler(...args);
        } catch (error) {
            return handleError(error, context);
        }
    };
}
