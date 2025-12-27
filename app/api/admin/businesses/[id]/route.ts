import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";
import { z } from "zod";
import EmailService from "@/lib/email-service";

export const dynamic = 'force-dynamic';

const businessUpdateSchema = z.object({
    status: z.enum(["approved", "pending", "suspended"]).optional(),
    notes: z.string().optional(),
});

/**
 * PUT /api/admin/businesses/[id]
 * Update business status or details
 * Admin only
 */
async function updateBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const validatedData = businessUpdateSchema.parse(body);

        await dbConnect();

        const business = await Business.findById(params.id);
        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        // Update business
        if (validatedData.status) {
            business.status = validatedData.status;
        }

        // TODO: Add notes field to Business model
        // if (validatedData.notes) {
        //   business.adminNotes = validatedData.notes;
        // }

        await business.save();

        // Send email notification to business owner about status change
        try {
            const businessWithUser = await Business.findById(business._id).populate('userId', 'fname lname email');
            if (businessWithUser && businessWithUser.userId) {
                if (validatedData.status === "approved") {
                    await EmailService.sendBusinessApproved({
                        business: businessWithUser as any,
                        owner: businessWithUser.userId as any
                    });
                } else if (validatedData.status === "suspended") {
                    await EmailService.sendBusinessSuspended({
                        business: businessWithUser as any,
                        owner: businessWithUser.userId as any,
                        reason: validatedData.notes || 'Violation of terms'
                    });
                }
            }
        } catch (emailError) {
            console.error("Failed to send status update email:", emailError);
        }

        return NextResponse.json({
            message: "Business updated successfully",
            business: {
                id: String(business._id),
                businessName: business.businessName,
                status: business.status,
            },
        });
    } catch (error: any) {
        console.error("Admin update business error:", error);
        if (error.name === "ZodError") {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update business" },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/admin/businesses/[id]
 * Delete a business (admin only - use with caution)
 */
async function deleteBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        await dbConnect();

        // TODO: Before deleting, check for:
        // - Active bookings
        // - Pending payments
        // - Services

        const business = await Business.findByIdAndDelete(params.id);
        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        return NextResponse.json({
            message: "Business deleted successfully"
        });
    } catch (error: any) {
        console.error("Admin delete business error:", error);
        return NextResponse.json(
            { error: "Failed to delete business" },
            { status: 500 }
        );
    }
}

export const PUT = withRateLimitDynamic(updateBusinessHandler);
export const DELETE = withRateLimitDynamic(deleteBusinessHandler);
