import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const response = NextResponse.json(
            { message: "Logged out successfully" },
            { status: 200 }
        );

        // Clear the HttpOnly cookie
        response.cookies.set({
            name: 'token',
            value: '',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error("Logout error:", error);
        return NextResponse.json(
            { error: "Failed to logout" },
            { status: 500 }
        );
    }
}
