/**
 * Approve Business API
 * PUT /api/admin/businesses/[id]/approve
 */
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
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
        const { adminNote } = body;

        // Find and update business
        const business = await Business.findById(businessId).populate(
            "userId",
            "fname lname email"
        );

        if (!business) {
            return NextResponse.json({ error: "Business not found" }, { status: 404 });
        }

        if (business.status === "approved") {
            return NextResponse.json(
                { error: "Business already approved" },
                { status: 400 }
            );
        }

        // Update status
        business.status = "approved";
        await business.save();

        // TODO: Send approval email to business owner
        // const user = business.userId;
        // await sendBusinessApprovalEmail(user.email, user.fname, business.businessName);

        console.log(
            `[Admin] Business approved: ${business.businessName} (ID: ${businessId})${adminNote ? ` - Note: ${adminNote}` : ""
            }`
        );

        return NextResponse.json({
            message: "Business approved successfully",
            business: {
                id: String(business._id),
                businessName: business.businessName,
                status: business.status,
            },
        });
    } catch (error: any) {
        console.error("Error approving business:", error);
        return NextResponse.json(
            { error: "Failed to approve business" },
            { status: 500 }
        );
    }
}
