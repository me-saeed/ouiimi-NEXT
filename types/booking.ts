/**
 * Centralized Booking Type Definition
 * matches backend schema in lib/models/Booking.ts
 */

export type BookingStatus =
    | "pre_payment"
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "refunded";

export type PaymentStatus =
    | "pending"
    | "deposit_paid"
    | "fully_paid"
    | "refunded";

export type AdminPaymentStatus =
    | "pending"
    | "released";

export interface Booking {
    id: string; // Frontend uses 'id' (mapped from _id)
    _id?: string; // Optional for raw API responses

    // Relations - usually populated objects in frontend views
    // keeping as 'any' for flexibility with varying population levels
    // in a stricter refactor, these would be generics or union types
    userId: any;
    businessId: any;
    serviceId: any;
    staffId: any;

    // Time Slot
    timeSlot: {
        date: string; // API returns ISO string
        startTime: string;
        endTime: string;
    };

    // Financials
    totalCost: number;
    depositAmount: number;
    remainingAmount: number;
    platformFee?: number;
    serviceAmount?: number;

    // Add-ons
    addOns: Array<{
        name: string;
        cost: number;
    }>;

    // Statuses
    status: BookingStatus | string; // allowing string for safety, but union is preferred
    paymentStatus: PaymentStatus | string;
    adminPaymentStatus?: AdminPaymentStatus | string;

    // Metadata
    bookingNumber?: number;
    customerNotes?: string;
    businessNotes?: string;

    // Cancellation
    cancelledAt?: string;
    cancellationReason?: string;
    cancelledBy?: "customer" | "business";

    // Payment
    paymentIntentId?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}
