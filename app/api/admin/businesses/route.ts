import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { verifyToken } from "@/lib/jwt";
import { withRateLimitDynamic } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/businesses
 * Get all businesses with filters and search
 * Admin only
 */
async function getBusinessesHandler(req: NextRequest) {
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

        // TODO: Add admin role check
        // if (decoded.role !== 'admin') {
        //   return NextResponse.json({ error: "Admin access required" }, { status: 403 });
        // }

        await dbConnect();

        // Get query parameters
        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") || "all"; // all, approved, pending, suspended
        const category = searchParams.get("category");
        const search = searchParams.get("search");
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        // Build query
        const query: any = {};

        // Status filter
        if (status !== "all") {
            query.status = status;
        }

        // Category filter
        if (category) {
            query.category = category;
        }

        // Search filter (business name or email)
        if (search) {
            query.$or = [
                { businessName: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        // Get businesses with pagination
        const businesses = await Business.find(query)
            .select("businessName email phone category status address logo createdAt userId")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count for pagination
        const total = await Business.countDocuments(query);

        // Get statistics
        const stats = await Business.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        const statistics = {
            total: await Business.countDocuments(),
            approved: stats.find(s => s._id === "approved")?.count || 0,
            pending: stats.find(s => s._id === "pending")?.count || 0,
            suspended: stats.find(s => s._id === "suspended")?.count || 0,
        };

        return NextResponse.json({
            businesses: businesses.map((b: any) => ({
                id: b._id.toString(),
                businessName: b.businessName,
                email: b.email,
                phone: b.phone,
                category: b.category,
                status: b.status,
                address: b.address,
                logo: b.logo,
                createdAt: b.createdAt,
                userId: b.userId?.toString(),
            })),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
            statistics,
        });
    } catch (error: any) {
        console.error("Admin get businesses error:", error);
        return NextResponse.json(
            { error: "Failed to fetch businesses" },
            { status: 500 }
        );
    }
}

export const GET = withRateLimitDynamic(getBusinessesHandler);
