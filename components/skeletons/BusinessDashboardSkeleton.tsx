/**
 * Skeleton loader for business dashboard
 * Shows content-aware placeholder during data loading
 */
export function BusinessDashboardSkeleton() {
    return (
        <div className="bg-background min-h-screen animate-pulse">
            {/* Header Skeleton */}
            <div className="bg-white py-8 border-b border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col items-center text-center space-y-4">
                        {/* Avatar skeleton */}
                        <div className="w-24 h-24 rounded-full bg-gray-200" />
                        {/* Business name skeleton */}
                        <div className="h-6 w-48 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>

            {/* Tab bar skeleton */}
            <div className="bg-white border-b border-border/50">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center w-full max-w-4xl mx-auto">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex-1 py-4">
                                <div className="h-4 w-20 bg-gray-200 rounded mx-auto" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content skeleton */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="space-y-4">
                    <div className="h-8 w-64 bg-gray-200 rounded" />
                    <div className="grid gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                                <div className="space-y-3">
                                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                                    <div className="h-4 w-1/2 bg-gray-200 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/**
 * Skeleton loader for registration form
 */
export function RegistrationFormSkeleton() {
    return (
        <div className="animate-pulse space-y-6">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                    <div className="h-4 w-24 bg-gray-200 rounded" />
                    <div className="h-12 w-full bg-gray-200 rounded-lg" />
                </div>
            ))}
            <div className="h-12 w-full bg-gray-300 rounded-lg mt-6" />
        </div>
    );
}

/**
 * Generic card skeleton
 */
export function CardSkeleton() {
    return (
        <div className="bg-white p-6 rounded-lg border border-gray-200 animate-pulse">
            <div className="space-y-3">
                <div className="h-5 w-3/4 bg-gray-200 rounded" />
                <div className="h-4 w-1/2 bg-gray-200 rounded" />
                <div className="h-4 w-2/3 bg-gray-200 rounded" />
            </div>
        </div>
    );
}
