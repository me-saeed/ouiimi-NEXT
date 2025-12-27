/**
 * =============================================================================
 * VERIFY EMAIL API ROUTE - /api/auth/verify-email
 * =============================================================================
 * 
 * This endpoint handles email verification via token.
 * 
 * HTTP METHOD: GET
 * 
 * QUERY PARAMS:
 *   token - The verification token from the email link
 * 
 * RESPONSE (Success - 302): Redirects to signin with success message
 * RESPONSE (Error - 302): Redirects to signin with error message
 */

import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import EmailService from "@/lib/email-service";
import { getBaseUrl } from "@/lib/utils/url";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            const baseUrl = getBaseUrl();
            const redirectUrl = new URL('/signin', baseUrl);
            redirectUrl.searchParams.set('error', 'Invalid verification link');
            return NextResponse.redirect(redirectUrl);
        }

        await dbConnect();

        // Find user with valid, non-expired token
        const user = await User.findOne({
            verificationToken: token,
            verificationTokenExpiry: { $gt: new Date() },
        });

        if (!user) {
            const baseUrl = getBaseUrl();
            const redirectUrl = new URL('/signin', baseUrl);
            redirectUrl.searchParams.set('error', 'Verification link expired or invalid');
            return NextResponse.redirect(redirectUrl);
        }

        // Mark user as verified
        user.verify = "yes";
        user.verificationToken = undefined;
        user.verificationTokenExpiry = undefined;
        await user.save();

        // Send welcome email now that user is verified
        try {
            await EmailService.sendShopperWelcome(user as any);
        } catch (emailError) {
            console.error("Error sending welcome email:", emailError);
        }

        // Redirect to signin with success message
        const baseUrl = getBaseUrl();
        const redirectUrl = new URL('/signin', baseUrl);
        redirectUrl.searchParams.set('verified', 'true');
        return NextResponse.redirect(redirectUrl);

    } catch (error: any) {
        console.error("Email verification error:", error);
        const baseUrl = getBaseUrl();
        const redirectUrl = new URL('/signin', baseUrl);
        redirectUrl.searchParams.set('error', 'Verification failed. Please try again.');
        return NextResponse.redirect(redirectUrl);
    }
}
