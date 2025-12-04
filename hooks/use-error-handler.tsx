/**
 * Error Handler Hook
 * Provides centralized error handling with automatic toast notifications
 */

import { useToast } from "./use-toast";
import { useCallback } from "react";

interface ErrorHandlerOptions {
    showToast?: boolean;
    logError?: boolean;
    onError?: (error: Error) => void;
}

interface ApiErrorResponse {
    error: string;
    code?: string;
    details?: any;
}

export function useErrorHandler() {
    const { toast } = useToast();

    const handleError = useCallback(
        (error: unknown, options: ErrorHandlerOptions = {}) => {
            const {
                showToast = true,
                logError = true,
                onError,
            } = options;

            let errorMessage = "An unexpected error occurred";
            let errorTitle = "Error";

            // Handle API error responses
            if (error && typeof error === "object" && "error" in error) {
                const apiError = error as ApiErrorResponse;
                errorMessage = apiError.error;

                // Customize title based on error code
                if (apiError.code === "VALIDATION_ERROR") {
                    errorTitle = "Validation Error";
                } else if (apiError.code === "AUTHENTICATION_ERROR") {
                    errorTitle = "Authentication Required";
                } else if (apiError.code === "AUTHORIZATION_ERROR") {
                    errorTitle = "Access Denied";
                } else if (apiError.code === "NOT_FOUND") {
                    errorTitle = "Not Found";
                } else if (apiError.code === "RATE_LIMIT_EXCEEDED") {
                    errorTitle = "Rate Limit Exceeded";
                }
            }
            // Handle Error objects
            else if (error instanceof Error) {
                errorMessage = error.message;
            }
            // Handle string errors
            else if (typeof error === "string") {
                errorMessage = error;
            }

            // Log error to console in development
            if (logError && process.env.NODE_ENV === "development") {
                console.error("Error handled:", error);
            }

            // Show toast notification
            if (showToast) {
                toast({
                    variant: "destructive",
                    title: errorTitle,
                    description: errorMessage,
                });
            }

            // Call custom error handler
            if (onError && error instanceof Error) {
                onError(error);
            }

            return errorMessage;
        },
        [toast]
    );

    const handleApiError = useCallback(
        async (response: Response, options: ErrorHandlerOptions = {}) => {
            try {
                const data = await response.json();
                return handleError(data, options);
            } catch {
                return handleError(
                    new Error(`Request failed with status ${response.status}`),
                    options
                );
            }
        },
        [handleError]
    );

    return {
        handleError,
        handleApiError,
    };
}

/**
 * Success notification hook
 */
export function useSuccessHandler() {
    const { toast } = useToast();

    const showSuccess = useCallback(
        (message: string, title: string = "Success") => {
            toast({
                variant: "success",
                title,
                description: message,
            });
        },
        [toast]
    );

    return { showSuccess };
}
