/**
 * =============================================================================
 * API TYPES - lib/types/api.ts
 * =============================================================================
 * 
 * These types define the SHAPE of data returned by the API to the Frontend.
 * They differ from Backend Models in that:
 * 1. IDs are strings (not Mongoose ObjectIds)
 * 2. Dates are strings (ISO format)
 * 3. No Mongoose methods (.save, .populate)
 * 4. Safe for use in Client Components ("use client")
 */

export interface ApiUser {
    _id: string;
    fname: string;
    lname: string;
    email: string;
    contactNo?: string;
    phone?: string;
    pic?: string;
}

export interface ApiBusiness {
    _id: string;
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
    serviceName: string;
    category: string;
    subCategory?: string;
    description?: string;
    // Add other fields as needed by frontend
}

export interface ApiBooking {
    _id: string;
    id?: string; // Mongoose virtual might be present
    bookingNumber?: number; // Some old bookings might not have it

    // Relationships - Populated or ID
    userId: ApiUser | string;
    businessId: ApiBusiness | string;
    serviceId: ApiService | string;
    staffId?: { _id: string; name: string; photo?: string } | string;

    // Time
    timeSlot: {
        date: string;       // ISO Date String
        startTime: string;
        endTime: string;
    };

    // Financials
    totalCost: number;
    baseCost?: number;
    depositAmount: number;
    remainingAmount: number;
    platformFee: number;

    // Status
    status: "pre_payment" | "pending" | "confirmed" | "completed" | "cancelled" | "refunded";
    paymentStatus: "pending" | "deposit_paid" | "fully_paid" | "refunded";

    // Data
    addOns?: Array<{
        name: string;
        cost: number;
    }>;
    customerNotes?: string;
    businessNotes?: string;
    cancellationReason?: string;

    paymentIntentId?: string;

    createdAt: string; // ISO Date String
    updatedAt: string; // ISO Date String
}
