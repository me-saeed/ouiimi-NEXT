import mongoose from "mongoose";
import Service from "@/lib/models/Service";
import { APIError } from "@/lib/api-response";

interface TimeSlotInput {
    date: string | Date;
    startTime: string;
    endTime: string;
    staffIds?: Array<string | { staffId: string } | any>;
}

interface ValidateServiceDuplicationParams {
    businessId: string;
    category?: string;
    subCategory: string;
    timeSlots: TimeSlotInput[];
    serviceIdToExclude?: string; // For updates, exclude self
}

/**
 * Validates if the proposed service time slots conflict with existing services
 * based on Subcategory + Date + Time + Staff.
 * 
 * Throws APIError (409) if a duplicate is found.
 */
export async function validateServiceDuplication({
    businessId,
    category,
    subCategory,
    timeSlots,
    serviceIdToExclude
}: ValidateServiceDuplicationParams): Promise<void> {

    if (!timeSlots || timeSlots.length === 0) return;

    for (const slot of timeSlots) {
        // 1. Prepare staff IDs for query
        let newStaffIds: mongoose.Types.ObjectId[] = [];

        if (slot.staffIds && Array.isArray(slot.staffIds)) {
            newStaffIds = slot.staffIds
                .map((id: any) => {
                    if (typeof id === 'string') return new mongoose.Types.ObjectId(id);
                    if (id.staffId) return new mongoose.Types.ObjectId(id.staffId);
                    return null;
                })
                .filter((id): id is mongoose.Types.ObjectId => id !== null);
        }

        // Skip check if no staff assigned (though usually required)
        if (newStaffIds.length === 0) continue;

        // 2. Construct query to find ANY service with a matching slot
        const collisionQuery: any = {
            businessId: new mongoose.Types.ObjectId(businessId),
            subCategory: subCategory, // Same subcategory
            // If category is provided, match it too (though subCategory is usually unique enough per business context)
            ...(category && { category }),
            // Exclude the current service being updated
            ...(serviceIdToExclude && { _id: { $ne: new mongoose.Types.ObjectId(serviceIdToExclude) } }),

            timeSlots: {
                $elemMatch: {
                    date: new Date(slot.date), // Exact date match
                    startTime: slot.startTime, // Exact start time
                    endTime: slot.endTime,     // Exact end time
                    // Check if ANY of the new staff IDs exist in the 'staffIds.staffId' of the existing slot
                    "staffIds.staffId": { $in: newStaffIds }
                }
            }
        };

        const existingService = await Service.findOne(collisionQuery).select('serviceName subCategory');

        if (existingService) {
            const dateStr = new Date(slot.date).toLocaleDateString();
            const timeStr = `${slot.startTime} - ${slot.endTime}`;

            throw new APIError(
                409,
                `Duplicate service detected: The service "${existingService.serviceName}" (Subcategory: ${subCategory}) is already scheduled on ${dateStr} at ${timeStr} with the same staff member(s).`,
                "DUPLICATE_SERVICE"
            );
        }
    }
}
