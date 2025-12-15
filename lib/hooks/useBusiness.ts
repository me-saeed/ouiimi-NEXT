import useSWR, { SWRConfiguration } from 'swr';

/**
 * Generic fetcher function for SWR
 * Automatically includes auth token from localStorage
 */
const fetcher = async (url: string) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch(url, { headers });

    if (!res.ok) {
        const error: any = new Error('An error occurred while fetching the data.');
        error.info = await res.json();
        error.status = res.status;
        throw error;
    }

    return res.json();
};

/**
 * Custom hook for fetching business data with SWR
 * Provides automatic caching, revalidation, and real-time updates
 * 
 * @param userId - User ID to fetch business for
 * @returns Business data, loading state, error, and mutate function
 */
export function useBusiness(userId: string | null | undefined) {
    const { data, error, isLoading, mutate, isValidating } = useSWR(
        userId ? `/api/business/search?userId=${userId}` : null,
        fetcher,
        {
            // Revalidate when window regains focus
            revalidateOnFocus: true,
            // Revalidate when network reconnects
            revalidateOnReconnect: true,
            // Auto-refresh every 30 seconds
            refreshInterval: 30000,
            // Dedupe requests within 5 seconds
            dedupingInterval: 5000,
            // Keep previous data while revalidating
            keepPreviousData: true,
            // Retry on error with exponential backoff
            shouldRetryOnError: true,
            errorRetryCount: 3,
            errorRetryInterval: 1000,
            // Success callback
            onSuccess: (data) => {
                console.log('[useBusiness] Data fetched successfully');
            },
            // Error callback
            onError: (err) => {
                console.error('[useBusiness] Error fetching business:', err);
            },
        } as SWRConfiguration
    );

    // Extract business from response
    const business = data?.businesses?.[0] || null;

    return {
        business,
        isLoading,
        isValidating, // True when revalidating in background
        error,
        mutate, // Function to manually trigger revalidation
    };
}

/**
 * Custom hook for fetching services data with SWR
 */
export function useServices(businessId: string | null | undefined) {
    const { data, error, isLoading, mutate } = useSWR(
        businessId ? `/api/services?businessId=${businessId}` : null,
        fetcher,
        {
            revalidateOnFocus: true,
            refreshInterval: 60000, // Refresh every 60s (less frequent than business)
            dedupingInterval: 10000,
        }
    );

    return {
        services: data?.services || [],
        isLoading,
        error,
        mutate,
    };
}

/**
 * Custom hook for fetching bookings data with SWR
 */
export function useBookings(businessId: string | null | undefined) {
    const { data, error, isLoading, mutate } = useSWR(
        businessId ? `/api/bookings?businessId=${businessId}` : null,
        fetcher,
        {
            revalidateOnFocus: true,
            refreshInterval: 20000, // Refresh every 20s (bookings update frequently)
            dedupingInterval: 5000,
        }
    );

    return {
        bookings: data?.bookings || [],
        isLoading,
        error,
        mutate,
    };
}
