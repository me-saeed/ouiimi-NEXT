import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User, { IUser } from "@/lib/models/User";
import { generateToken } from "@/lib/jwt";
import { withRateLimit } from "@/lib/security/rate-limit";

async function googleOAuthHandler(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, picture, sub: googleId } = body;

    if (!email || !googleId) {
      return NextResponse.json(
        { error: "Missing required OAuth data" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists with this Google ID
    let user: IUser | null = await User.findOne({
      $or: [
        { oauthId: googleId, oauthProvider: "google" },
        { email: email.toLowerCase() },
      ],
    });

    if (user) {
      // Update OAuth info if not set
      if (!user.oauthProvider || !user.oauthId) {
        user.oauthProvider = "google";
        user.oauthId = googleId;
        if (picture) user.pic = picture;
        await user.save();
      }
    } else {
      // Create new user
      const nameParts = name?.split(" ") || ["", ""];
      const lastRecord = await User.findOne().sort({ counterId: -1 }).limit(1);
      const counterId = lastRecord ? lastRecord.counterId + 1 : 1;

      user = await User.create({
        fname: nameParts[0] || "User",
        lname: nameParts.slice(1).join(" ") || "",
        email: email.toLowerCase(),
        oauthProvider: "google",
        oauthId: googleId,
        pic: picture || "avatar.png",
        verify: "yes",
        counterId,
      });
    }

    // Ensure user is not null
    if (!user || !user._id) {
      return NextResponse.json(
        { error: "Failed to create or retrieve user" },
        { status: 500 }
      );
    }

    // Generate JWT token
    const token = generateToken({
      userId: String(user._id),
      email: user.email,
      username: user.username || "",
    });

    user.token = token;
    await user.save();

    const userData = {
      id: String(user._id),
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      username: user.username,
      token,
    };

    return NextResponse.json(
      {
        message: "OAuth login successful",
        user: userData,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Google OAuth error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { error: "Account already exists with this email" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "OAuth authentication failed" },
      { status: 500 }
    );
  }
}

export const POST = withRateLimit(googleOAuthHandler);

