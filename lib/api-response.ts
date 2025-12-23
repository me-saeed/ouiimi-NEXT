import { NextResponse, NextRequest } from 'next/server';
import { ZodError } from 'zod';

/**
 * Custom API Error class for standardized error handling
 */
export class APIError extends Error {
    constructor(
        public statusCode: number,
        message: string,
        public code?: string,
        public details?: any
    ) {
        super(message);
        this.name = 'APIError';
    }
}

/**
 * Predefined API errors
 */
export const APIErrors = {
    Unauthorized: new APIError(401, 'Unauthorized', 'UNAUTHORIZED'),
    Forbidden: new APIError(403, 'Forbidden', 'FORBIDDEN'),
    NotFound: new APIError(404, 'Resource not found', 'NOT_FOUND'),
    BadRequest: (message: string) => new APIError(400, message, 'BAD_REQUEST'),
    ValidationError: (details: any) => new APIError(400, 'Validation error', 'VALIDATION_ERROR', details),
    InternalError: new APIError(500, 'Internal server error', 'INTERNAL_ERROR'),
    RateLimitExceeded: new APIError(429, 'Too many requests', 'RATE_LIMIT_EXCEEDED'),
};

/**
 * Format and return error response
 */
export function errorResponse(error: unknown): NextResponse {
    // Handle APIError instances
    if (error instanceof APIError) {
        const body: any = {
            error: error.message,
            code: error.code,
        };

        if (error.details) {
            body.details = error.details;
        }

        return NextResponse.json(body, { status: error.statusCode });
    }

    // Handle Zod validation errors
    if (error instanceof ZodError) {
        return NextResponse.json(
            {
                error: 'Validation error',
                code: 'VALIDATION_ERROR',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message,
                })),
            },
            { status: 400 }
        );
    }

    // Handle generic errors
    if (error instanceof Error) {
        // Don't expose internal error messages in production
        const message =
            process.env.NODE_ENV === 'production'
                ? 'Internal server error'
                : error.message;

        console.error('[API Error]', error);

        return NextResponse.json(
            {
                error: message,
                code: 'INTERNAL_ERROR',
            },
            { status: 500 }
        );
    }

    // Unknown error type
    console.error('[API Error - Unknown]', error);
    return NextResponse.json(
        {
            error: 'Internal server error',
            code: 'INTERNAL_ERROR',
        },
        { status: 500 }
    );
}

/**
 * Success response helper
 */
export function successResponse<T>(
    data: T,
    status = 200,
    headers?: Record<string, string>
): NextResponse {
    const responseData = {
        success: true,
        data,
    };

    return NextResponse.json(responseData, {
        status,
        headers: headers ? new Headers(headers) : undefined,
    });
}

/**
 * Created response helper (201)
 */
export function createdResponse<T>(data: T): NextResponse {
    return successResponse(data, 201);
}

/**
 * No content response helper (204)
 */
export function noContentResponse(): NextResponse {
    return new NextResponse(null, { status: 204 });
}

/**
 * Async error handler wrapper for API routes
 */
export function asyncHandler(
    handler: (request: NextRequest, context?: any) => Promise<NextResponse>
) {
    return async (request: NextRequest, context?: any): Promise<NextResponse> => {
        try {
            return await handler(request, context);
        } catch (error) {
            return errorResponse(error);
        }
    };
}
