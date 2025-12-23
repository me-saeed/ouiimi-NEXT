/**
 * ============================================================================
 * Fetch Utility - Session-Based Authentication
 * ============================================================================
 * 
 * Helper functions for making authenticated API requests using session cookies.
 * Replaces old localStorage token-based authentication.
 */

/**
 * Make an authenticated fetch request
 * Session cookies are sent automatically with credentials: 'include'
 * 
 * @param url - API endpoint URL
 * @param options - Fetch options (method, body, etc.)
 * @returns Response data
 */
export async function authenticatedFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const defaultHeaders: HeadersInit = {
        'Content-Type': 'application/json',
    };

    return fetch(url, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...options.headers,
        },
        credentials: 'include', // Important: sends session cookie
    });
}

/**
 * Helper for authenticated JSON requests
 */
export async function fetchJSON<T = any>(
    url: string,
    options: RequestInit = {}
): Promise<T> {
    const response = await authenticatedFetch(url, options);

    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Helper for POST requests
 */
export async function postJSON<T = any>(
    url: string,
    data: any
): Promise<T> {
    return fetchJSON<T>(url, {
        method: 'POST',
        body: JSON.stringify(data),
    });
}

/**
 * Helper for PUT requests
 */
export async function putJSON<T = any>(
    url: string,
    data: any
): Promise<T> {
    return fetchJSON<T>(url, {
        method: 'PUT',
        body: JSON.stringify(data),
    });
}

/**
 * Helper for DELETE requests
 */
export async function deleteJSON<T = any>(url: string): Promise<T> {
    return fetchJSON<T>(url, {
        method: 'DELETE',
    });
}
