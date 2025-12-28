/**
 * Email Utility Functions
 * Provides sanitization, validation, and formatting helpers for email service
 */

/**
 * Escape HTML special characters to prevent XSS attacks
 * CRITICAL: Use this for ALL user-supplied content in emails
 */
export function escapeHTML(text: string | null | undefined): string {
    if (!text) return '';

    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string | null | undefined): boolean {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Format booking date consistently
 */
export function formatBookingDate(date: string | Date | null | undefined): string {
    try {
        if (!date) return 'Date not available';

        const dateObj = new Date(date);

        if (isNaN(dateObj.getTime())) {
            console.warn(`Invalid date provided: ${date}`);
            return 'Date not available';
        }

        return dateObj.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Date not available';
    }
}

/**
 * Format monetary amount safely
 */
export function formatAmount(amount: any): string {
    const num = Number(amount);

    if (isNaN(num)) {
        console.warn(`Invalid amount provided: ${amount}`);
        return '0.00';
    }

    if (num < 0) {
        console.warn(`Negative amount provided: ${amount}`);
        return '0.00';
    }

    return num.toFixed(2);
}

/**
 * Safely get customer full name
 */
export function getCustomerName(fname: string | null | undefined, lname?: string | null): string {
    const first = fname || 'Customer';
    const last = lname || '';
    return `${first} ${last}`.trim();
}

/**
 * Safely get booking number
 */
export function getBookingNumber(bookingNumber: string | number | null | undefined, bookingId?: any): string {
    if (bookingNumber) return String(bookingNumber);
    if (bookingId?._id) return bookingId._id.toString().slice(-8);
    if (bookingId) return bookingId.toString().slice(-8);
    return 'N/A';
}

/**
 * Validate environment variables
 */
export function validateEmailConfig(): void {
    const required = ['MAILJET_API_KEY', 'MAILJET_SECRET_KEY', 'MAILJET_FROM_EMAIL'];
    const missing: string[] = [];

    for (const key of required) {
        if (!process.env[key]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(
            `Missing required email configuration: ${missing.join(', ')}. ` +
            `Please set these environment variables.`
        );
    }
}

/**
 * Safely format business address
 */
export function formatBusinessAddress(address: any): string {
    if (!address) return 'Address not available';

    if (typeof address === 'object' && address.street && address.city) {
        return `${address.street}, ${address.city}`;
    }

    if (typeof address === 'string') {
        return address;
    }

    return 'Address not available';
}
