import { z } from "zod";

export const bookingCreateSchema = z.object({
    userId: z.string(),
    businessId: z.string(),
    serviceId: z.string(),
    staffId: z.string().optional(),
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
