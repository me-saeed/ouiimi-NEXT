import { z } from "zod";

const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

export const bookingCreateSchema = z.object({
    userId: objectIdSchema,
    businessId: objectIdSchema,
    serviceId: objectIdSchema,
    staffId: objectIdSchema.optional(),
    timeSlot: z.object({
        date: z.string(),
        startTime: z.string(),
        endTime: z.string(),
    }),
    addOns: z.array(z.object({
        name: z.string(),
        cost: z.number().min(0),
    })).optional(),
    totalCost: z.number().min(0),
    customerNotes: z.string().optional(),
});

