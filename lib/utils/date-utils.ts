/**
 * Date utility functions to handle timezone issues
 * 
 * The main problem is when dates are stored as YYYY-MM-DD strings,
 * and new Date() interprets them as UTC midnight, which can shift
 * the date by 1 day in certain timezones.
 */

/**
 * Parse a date string and treat it as a local date (not UTC)
 * This prevents the 1-day-off issue caused by timezone conversion
 * 
 * @param dateString - Date in YYYY-MM-DD format or ISO format
 * @returns Date object in local timezone
 */
export function parseLocalDate(dateString: string | Date): Date {
    if (dateString instanceof Date) {
        return dateString;
    }

    // If it's a YYYY-MM-DD format, parse it as local date
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
    }

    // If it's an ISO date string, extract just the date part and parse locally
    if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0];
        const [year, month, day] = datePart.split('-').map(Number);
        return new Date(year, month - 1, day);
    }

    // Fallback to regular Date parsing
    return new Date(dateString);
}

/**
 * Format a date to YYYY-MM-DD string without timezone conversion
 * 
 * @param date - Date object or date string
 * @returns Date string in YYYY-MM-DD format
 */
export function formatDateLocal(date: Date | string): string {
    const d = typeof date === 'string' ? parseLocalDate(date) : date;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Format a date for display (DD/MM/YYYY format)
 * 
 * @param dateString - Date string in any format
 * @returns Formatted date string like "21/12/2024"
 */
export function formatDateForDisplay(dateString: string | Date): string {
    const date = parseLocalDate(dateString);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });
}

/**
 * Check if two dates are the same day (ignoring time)
 * 
 * @param date1 - First date
 * @param date2 - Second date
 * @returns true if same day
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
    return formatDateLocal(date1) === formatDateLocal(date2);
}
