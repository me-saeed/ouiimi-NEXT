/**
 * Admin Dashboard Skeleton Loader
 */
export function AdminDashboardSkeleton() {
    return (
        <div className="bg-white min-h-screen animate-pulse">
            {/* Header Skeleton */}
            <div className="py-8 border-b border-gray-100">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-8 w-64 bg-gray-200 rounded mb-2" />
                    <div className="h-4 w-48 bg-gray-200 rounded" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="border-b border-gray-200">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex gap-6 py-4">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-4 w-24 bg-gray-200 rounded" />
                        ))}
                    </div>
                </div>
            </div>

            {/* Content Skeleton */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                            <div className="h-4 w-32 bg-gray-200 rounded mb-3" />
                            <div className="h-8 w-24 bg-gray-200 rounded mb-2" />
                            <div className="h-3 w-20 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>

                {/* Table Skeleton */}
                <div className="space-y-4">
                    <div className="h-6 w-48 bg-gray-200 rounded" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="bg-white p-6 rounded-lg border border-gray-200">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                </div>
                                <div className="h-8 w-24 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
