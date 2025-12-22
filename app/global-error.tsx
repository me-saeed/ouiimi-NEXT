'use client';

import { useEffect } from 'react';

/**
 * Global Error Boundary for the application
 * Catches runtime errors and displays user-friendly message
 */
export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log error to console in development
        console.error('Global error:', error);

        // TODO: Send to error tracking service (Sentry) in production
        if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
            // Sentry.captureException(error);
        }
    }, [error]);

    return (
        <html>
            <body>
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full text-center">
                        <div className="mb-8">
                            <h1 className="text-6xl font-bold text-red-600 mb-4">500</h1>
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Something went wrong
                            </h2>
                            <p className="text-gray-600">
                                We&apos;re sorry, but something unexpected happened. Our team has been notified.
                            </p>
                            {error.digest && (
                                <p className="text-sm text-gray-500 mt-2">
                                    Error ID: {error.digest}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={reset}
                                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
                            >
                                Try again
                            </button>
                            <a
                                href="/"
                                className="block w-full bg-gray-200 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-300 transition"
                            >
                                Go to homepage
                            </a>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}
