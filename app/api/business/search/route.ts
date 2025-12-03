import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import { withRateLimit } from "@/lib/security/rate-limit";

export const dynamic = 'force-dynamic';

async function searchBusinessHandler(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const userId = searchParams.get("userId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "20");
    const page = parseInt(searchParams.get("page") || "1");
    const skip = (page - 1) * limit;

    const searchFilter: any = {};
    
    // If searching by userId, don't filter by status (to get pending businesses too)
    if (userId) {
      const mongoose = (await import("mongoose")).default;
      searchFilter.userId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId)
        : userId;
    } else if (status) {
      // Only filter by status if not searching by userId
      searchFilter.status = status;
    } else {
      // Default to approved if no userId and no status specified
      searchFilter.status = "approved";
    }

    if (query) {
      searchFilter.$or = [
        { businessName: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    const [businesses, total] = await Promise.all([
      Business.find(searchFilter)
        .populate("userId", "fname lname email")
        .select("-bankDetails")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Business.countDocuments(searchFilter),
    ]);

    return NextResponse.json(
      {
        businesses: businesses.map((b: any) => ({
          id: b._id?.toString() || b._id,
          _id: b._id?.toString() || b._id,
          userId: typeof b.userId === 'object' ? {
            id: b.userId._id?.toString() || b.userId._id,
            fname: b.userId.fname,
            lname: b.userId.lname,
            email: b.userId.email,
          } : b.userId?.toString() || b.userId,
          businessName: b.businessName,
          email: b.email,
          phone: b.phone,
          address: b.address,
          logo: b.logo,
          story: b.story,
          status: b.status,
          createdAt: b.createdAt,
        })),
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Search business error:", error);
    return NextResponse.json(
      { error: "Failed to search businesses" },
      { status: 500 }
    );
  }
}

export const GET = withRateLimit(searchBusinessHandler);

