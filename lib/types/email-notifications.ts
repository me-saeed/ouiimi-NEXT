/**
 * Strict Type Definitions for Email Notifications
 * Ensures all email service calls have guaranteed data availability.
 */

// Base Types
export interface EmailRecipient {
    _id?: string | any;
    fname: string;
    lname?: string;
    email: string;
    contactNo?: string;
    phone?: string;
}

export interface EmailBusiness {
    _id?: string | any;
    businessName: string;
    email: string; // CRITICAL: Must be verified present
    phone?: string;
    address?: string | {
        street: string;
        city: string;
        location?: any;
    };
}

export interface EmailServiceItem {
    _id?: string | any;
    serviceName: string;
    category?: string | any; // Sometimes populated as object or string
}

export interface EmailBooking {
    _id?: string | any;
    bookingNumber?: number;
    timeSlot: {
        date: Date | string;
        startTime: string;
        endTime: string;
    };
    totalCost: number;
    depositAmount: number;
    platformFee: number;
    remainingAmount: number;
    paymentStatus?: string;
    status?: string;
}

// Payload Interfaces used by EmailService
export interface BookingEmailPayload {
    booking: EmailBooking;
    customer: EmailRecipient;
    business: EmailBusiness;
    service: EmailServiceItem;
}

export interface PaymentReleasedPayload {
    booking: EmailBooking;
    business: EmailBusiness;
    service: EmailServiceItem;
    customer: EmailRecipient;
    category: string;
}

export interface BusinessStatusPayload {
    business: EmailBusiness;
    owner: EmailRecipient;
    reason?: string; // For rejection or suspension
}
