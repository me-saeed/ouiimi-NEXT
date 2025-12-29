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

// =============================================================================
// SERVICE TYPES - For type-safe service validation and API operations
// =============================================================================

/**
 * Staff ID entry with booking status
 * Used in time slot's staffIds array
 */
export interface StaffIdEntry {
    staffId: string;
    isBooked: boolean;
    staffDetails?: {
        _id: string;
        name: string;
        photo?: string;
    };
}

/**
 * Add-on entry for services
 */
export interface AddOnEntry {
    name: string;
    cost: number;
}

/**
 * Time slot entry for service creation/editing
 * Input format (before Mongoose conversion)
 */
export interface TimeSlotInput {
    date: string | Date;
    startTime: string;
    endTime: string;
    price: number;
    duration?: number;
    staffIds: string[];
    addOns?: AddOnEntry[];
}

/**
 * Time slot entry after processing (from database)
 * Output format with full staff data
 */
export interface TimeSlotEntry {
    date: Date | string;
    startTime: string;
    endTime: string;
    price: number;
    duration: number;
    staffIds: StaffIdEntry[];
    addOns?: AddOnEntry[];
    isBooked: boolean;
    bookingId?: string;
}

/**
 * Processed time slot for API responses
 */
export interface ProcessedTimeSlot {
    date: string | Date;
    startTime: string;
    endTime: string;
    price: number;
    duration: number;
    staffIds: StaffIdEntry[];
    isBooked: boolean;
}

/**
 * MongoDB filter query for services
 */
export interface ServiceFilterQuery {
    businessId?: string;
    category?: string;
    subCategory?: string;
    status?: string;
    $or?: Array<{ subCategory?: string; serviceName?: string }>;
}

/**
 * Service list item for API responses
 */
export interface ServiceListItem {
    id: string;
    _id: string;
    businessId: ApiBusiness | string;
    category: string;
    subCategory?: string;
    serviceName: string;
    description?: string;
    duration?: number;
    address: string;
    addressLocation?: {
        type: "Point";
        coordinates: number[];
    };
    addOns: AddOnEntry[];
    timeSlots: ProcessedTimeSlot[];
    date?: string;
    time?: string;
    status: string;
    createdAt?: string;
    distance?: string;
}

/**
 * Service creation/update data
 */
export interface ServiceData {
    businessId: string;
    category: string;
    subCategory?: string;
    serviceName: string;
    description?: string;
    address: {
        street: string;
        location: {
            type: "Point";
            coordinates: [number, number];
        };
    };
    addOns?: AddOnEntry[];
    timeSlots?: TimeSlotInput[];
    defaultStaffIds?: string[];
    status?: "listed" | "booked" | "completed" | "cancelled";
}

