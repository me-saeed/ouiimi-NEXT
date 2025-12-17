/**
 * Reject Business API
 * PUT /api/admin/businesses/[id]/reject
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { verifyToken } from "@/lib/jwt";

export const dynamic = 'force-dynamic';

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin auth
        const authHeader = req.headers.get("authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const token = authHeader.substring(7);
        const decoded = verifyToken(token);

        if (!decoded.roles?.includes('admin')) {
            return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        }

        await dbConnect();

        const businessId = params.id;
        const body = await req.json();
        const { reason } = body;

        if (!reason || reason.trim().length < 10) {
            return NextResponse.json(
                { error: "Rejection reason required (minimum 10 characters)" },
                { status: 400 }
            );
        }

        // Find and update business
        const business = await Business.findById(businessId).populate(
            "userId",
            "fname lname email"
        );

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        // Update status
        business.status = "rejected";
        await business.save();

        // TODO: Send rejection email to business owner with reason
        // await sendBusinessRejectionEmail(user.email, user.fname, business.businessName, reason);

        console.log(
            `[Admin] Business rejected: ${business.businessName} (ID: ${businessId}) - Reason: ${reason}`
        );

        return NextResponse.json({
            message: "Business rejected",
            business: {
                id: String(business._id),
                businessName: business.businessName,
                status: business.status,
            },
        });
    } catch (error: any) {
        console.error("Error rejecting business:", error);
        return NextResponse.json(
            { error: "Failed to reject business" },
            { status: 500 }
        );
    }
}
