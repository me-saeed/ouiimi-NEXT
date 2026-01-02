/**
 * Centralized Role Management Utility
 * Handles user role updates with automatic session synchronization
 */

import { NextResponse } from 'next/server';
import { createSession } from '@/lib/session';
import { createBusinessSession } from '@/lib/business-session';
import User from '@/lib/models/User';

const SESSION_DURATION = 7 * 24 * 60 * 60; // 7 days in seconds
const BUSINESS_SESSION_DURATION = 15 * 60; // 15 minutes in seconds

/**
 * Update user role and create new session cookie
 * This ensures database and session stay in sync
 * 
 * @param userId - User ID to update
 * @param newRole - New role to assign ('business', 'admin', 'user')
 * @param response - Optional NextResponse to set cookie on
 * @param businessId - Optional business ID for business role
 * @returns Updated user data and session token
 */
export async function updateUserRoleWithSession(
    userId: string,
    newRole: 'business' | 'admin' | 'user',
    response?: NextResponse,
    businessId?: string
) {
    try {
        // Update user role in database
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role: newRole },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error('User not found');
        }

        console.log(`[ROLE UPDATE] User ${userId} role updated to '${newRole}'`);

        // Create new session with updated role
        const sessionToken = await createSession({
            userId: String(updatedUser._id),
            email: updatedUser.email,
            role: newRole,
            fname: updatedUser.fname,
            lname: updatedUser.lname,
        });

        // If response provided, set cookie in response headers
        if (response) {
            response.cookies.set('session', sessionToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: SESSION_DURATION,
                path: '/',
            });
            console.log(`[ROLE UPDATE] Session cookie set in response`);

            // If business role, also create business session
            if (newRole === 'business') {
                const businessSessionToken = await createBusinessSession({
                    userId: String(updatedUser._id),
                    email: updatedUser.email,
                    businessId: businessId,
                });

                response.cookies.set('business-session', businessSessionToken, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    maxAge: BUSINESS_SESSION_DURATION,
                    path: '/',
                });
                console.log(`[ROLE UPDATE] Business session cookie set in response`);
            }
        }

        return {
            user: updatedUser,
            sessionToken,
        };
    } catch (error) {
        console.error('[ROLE UPDATE] Failed to update role:', error);
        throw error;
    }
}

/**
 * Helper to update role and return response with session cookie
 * Use this in API routes that need to update user role
 */
export async function updateRoleAndRespond(
    userId: string,
    newRole: 'business' | 'admin' | 'user',
    responseData: any,
    status: number = 200,
    businessId?: string
): Promise<NextResponse> {
    const response = NextResponse.json(responseData, { status });

    await updateUserRoleWithSession(userId, newRole, response, businessId);

    return response;
}

