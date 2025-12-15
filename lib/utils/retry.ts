/**
 * Retry function with exponential backoff
 * Automatically retries failed operations with increasing delays
 * 
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise with result or throws after max retries
 */
export async function retryWithBackoff<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        initialDelay?: number;
        maxDelay?: number;
        onRetry?: (attempt: number, error: any, delay: number) => void;
        shouldRetry?: (error: any) => boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        initialDelay = 1000,
        maxDelay = 10000,
        onRetry,
        shouldRetry = () => true,
    } = options;

    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;

            // Don't retry if we've exhausted attempts
            if (attempt > maxRetries) {
                throw error;
            }

            // Check if we should retry this error
            if (!shouldRetry(error)) {
                throw error;
            }

            // Calculate delay with exponential backoff
            const delay = Math.min(initialDelay * Math.pow(2, attempt - 1), maxDelay);

            // Notify about retry
            if (onRetry) {
                onRetry(attempt, error, delay);
            }

            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }

    throw lastError;
}

/**
 * Check if error is a network error (should be retried)
 */
export function isNetworkError(error: any): boolean {
    // Network errors typically have no response
    if (!error.status && error.message) {
        return true;
    }

    // Timeout errors
    if (error.name === 'AbortError' || error.message?.includes('timeout')) {
        return true;
    }

    // 5xx server errors (should retry)
    if (error.status >= 500) {
        return true;
    }

    // 408 Request Timeout, 429 Too Many Requests
    if (error.status === 408 || error.status === 429) {
        return true;
    }

    return false;
}

/**
 * Check if error is a validation error (should NOT be retried)
 */
export function isValidationError(error: any): boolean {
    // 4xx client errors (except 408, 429)
    if (error.status >= 400 && error.status < 500 && error.status !== 408 && error.status !== 429) {
        return true;
    }

    return false;
}

/**
 * Format retry error message for user display
 */
export function formatRetryMessage(attempt: number, maxRetries: number, delay: number): string {
    const secondsRemaining = Math.ceil(delay / 1000);
    return `Retrying... (Attempt ${attempt}/${maxRetries}) - Next retry in ${secondsRemaining}s`;
}
