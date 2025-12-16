import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import User from "@/lib/models/User";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

async function getAllBusinessesHandler(req: NextRequest) {
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

        // Get query parameters for filtering
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status"); // pending, approved, rejected, all
        const search = searchParams.get("search"); // search by business name or email

        // Build query
        let query: any = {};
        if (status && status !== "all") {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        // Fetch businesses with user info
        const businesses = await Business.find(query)
            .populate("userId", "fname lname email")
            .sort({ createdAt: -1 })
            .lean();

        // Format response
        const formattedBusinesses = businesses.map((business: any) => ({
            id: business._id.toString(),
            businessName: business.businessName,
            email: business.email,
            phone: business.phone,
            address: business.address,
            logo: business.logo,
            status: business.status,
            owner: business.userId
                ? {
                    id: business.userId._id.toString(),
                    name: `${business.userId.fname} ${business.userId.lname}`,
                    email: business.userId.email,
                }
                : null,
            createdAt: business.createdAt,
            updatedAt: business.updatedAt,
            bankDetails: business.bankDetails || null,
        }));

        return NextResponse.json(
            {
                businesses: formattedBusinesses,
                total: formattedBusinesses.length,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error("Get all businesses error:", error);
        return NextResponse.json(
            { error: "Failed to fetch businesses" },
            { status: 500 }
        );
    }
}

export const GET = withRateLimitDynamic(getAllBusinessesHandler);
