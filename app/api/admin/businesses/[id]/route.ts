import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

async function approveBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        // Check if user is admin
        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user || !user.Roles.includes("admin")) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        // Find business
        const business = await Business.findById(params.id);
        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        // Update status to approved
        business.status = "approved";
        await business.save();

        console.log(`[Admin] Business ${business.businessName} approved by admin ${user.email}`);

        return NextResponse.json(
            {
                message: "Business approved successfully",
                business: {
                    id: business._id.toString(),
                    businessName: business.businessName,
                    status: business.status,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Approve business error:", error);
        return NextResponse.json(
            { error: "Failed to approve business" },
            { status: 500 }
        );
    }
}

async function rejectBusinessHandler(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
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

        // Check if user is admin
        await dbConnect();
        const user = await User.findById(decoded.userId);
        if (!user || !user.Roles.includes("admin")) {
            return NextResponse.json(
                { error: "Unauthorized - Admin access required" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const { reason } = body; // Optional rejection reason

        // Find business
        const business = await Business.findById(params.id);
        if (!business) {
            return NextResponse.json(
                { error: "Business not found" },
                { status: 404 }
            );
        }

        // Update status to rejected
        business.status = "rejected";
        await business.save();

        console.log(`[Admin] Business ${business.businessName} rejected by admin ${user.email}. Reason: ${reason || "Not provided"}`);

        return NextResponse.json(
            {
                message: "Business rejected successfully",
                business: {
                    id: business._id.toString(),
                    businessName: business.businessName,
                    status: business.status,
                },
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Reject business error:", error);
        return NextResponse.json(
            { error: "Failed to reject business" },
            { status: 500 }
        );
    }
}

export const PUT = withRateLimitDynamic(async (req: NextRequest, context: any) => {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get("action");

    if (action === "approve") {
        return approveBusinessHandler(req, context);
    } else if (action === "reject") {
        return rejectBusinessHandler(req, context);
    } else {
        return NextResponse.json(
            { error: "Invalid action. Use ?action=approve or ?action=reject" },
            { status: 400 }
        );
    }
});
