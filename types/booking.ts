/**
 * Centralized Booking Type Definition
 * matches backend schema in lib/models/Booking.ts
 *
 * NOW STRICTLY TYPED matching API Responses.
 */

export interface ApiUser {
    _id: string;
    id?: string;
    fname: string;
    lname: string;
    email: string;
    contactNo?: string;
    phone?: string; // legacy support
    pic?: string;
}

export interface ApiBusiness {
    _id: string;
    id?: string;
    businessName: string;
    email: string;
    phone?: string;
    address: string;
    logo?: string;
    status: "pending" | "approved" | "rejected" | "suspended";
    location?: {
        type: "Point";
        coordinates: number[];
    };
}

export interface ApiService {
    _id: string;
    id?: string;
    serviceName: string;
    category: string;
    subCategory?: string;
    description?: string;
}

export type BookingStatus =
    | "pre_payment"
    | "pending"
    | "confirmed"
    | "completed"
    | "cancelled"
    | "refunded";

export interface Booking {
    id: string; // Frontend uses 'id'
    _id: string; // API sends '_id'

    // Relations - Strictly Typed Union
    userId: ApiUser | string;
    businessId: ApiBusiness | string;
    serviceId: ApiService | string;
    staffId?: { _id: string; name: string; photo?: string } | string;

    // Time Slot
    timeSlot: {
        date: string; // API returns ISO string
        startTime: string;
        endTime: string;
    };

    // Financials
    totalCost: number;
    baseCost?: number;
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
    status: BookingStatus | string;
    paymentStatus: "pending" | "deposit_paid" | "fully_paid" | "refunded" | string;
    adminPaymentStatus?: "pending" | "released" | "refund_pending" | string;

    // Metadata
    bookingNumber?: number;
    customerNotes?: string;
    businessNotes?: string;

    // Cancellation
    cancelledAt?: string;
    cancellationReason?: string;
    cancelledBy?: "customer" | "business" | "admin";

    // Payment
    paymentIntentId?: string;

    // Timestamps
    createdAt?: string;
    updatedAt?: string;
}
