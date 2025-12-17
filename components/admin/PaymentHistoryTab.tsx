/**
 * Payment History Tab - Admin Dashboard
 * Shows all released payments
 */
"use client";

import { Calendar, DollarSign, Building2, User } from "lucide-react";

interface Booking {
    id: string;
    bookingNumber: number;
    userId: any;
    businessId: any;
    serviceId: any;
    timeSlot: {
        date: string;
        startTime: string;
        endTime: string;
    };
    addOns?: Array<{ name: string; cost: number }>;
    totalCost: number;
    depositAmount: number;
    platformFee: number;
    serviceAmount: number;
    status: string;
    paymentStatus: string;
    adminPaymentStatus: string;
    createdAt: string;
    updatedAt: string;
}

interface PaymentHistoryTabProps {
    bookings: Booking[];
    isLoading: boolean;
}

export function PaymentHistoryTab({ bookings, isLoading }: PaymentHistoryTabProps) {
    if (isLoading) {
        return <div className="text-center py-12">Loading payment history...</div>;
    }

    if (bookings.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No Released Payments</p>
                <p className="text-sm">Released payments will appear here</p>
            </div>
        );
    }

    // Calculate totals
    const totalDeposits = bookings.reduce((sum, b) => sum + b.depositAmount, 0);
    const totalPlatformFees = bookings.reduce((sum, b) => sum + b.platformFee, 0);
    const totalReleased = bookings.reduce((sum, b) => sum + (b.depositAmount - b.platformFee), 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6">
                    <p className="text-sm text-blue-700 mb-1">Total Deposits Collected</p>
                    <p className="text-3xl font-bold text-blue-900">${totalDeposits.toFixed(2)}</p>
                    <p className="text-xs text-blue-600 mt-1">{bookings.length} bookings</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6">
                    <p className="text-sm text-green-700 mb-1">Platform Fees Earned</p>
                    <p className="text-3xl font-bold text-green-900">${totalPlatformFees.toFixed(2)}</p>
                    <p className="text-xs text-green-600 mt-1">$1.99 per booking</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6">
                    <p className="text-sm text-purple-700 mb-1">Released to Businesses</p>
                    <p className="text-3xl font-bold text-purple-900">${totalReleased.toFixed(2)}</p>
                    <p className="text-xs text-purple-600 mt-1">Net after fees</p>
                </div>
            </div>

            {/* Payment History List */}
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Released Payments</h3>

                <div className="space-y-3">
                    {bookings.map((booking) => {
                        const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
                        const business = typeof booking.businessId === 'object' ? booking.businessId : null;
                        const user = typeof booking.userId === 'object' ? booking.userId : null;
                        const releasedAmount = booking.depositAmount - booking.platformFee;

                        return (
                            <div
                                key={booking.id}
                                className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        {/* Service & Business Info */}
                                        <div className="mb-3">
                                            <h4 className="font-semibold text-gray-900">
                                                {service?.serviceName || 'Service'}
                                            </h4>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <Building2 className="w-4 h-4" />
                                                <span>{business?.businessName || 'Business'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                                <User className="w-4 h-4" />
                                                <span>
                                                    {user?.fname || 'N/A'} {user?.lname || ''} ({user?.email || 'N/A'})
                                                </span>
                                            </div>
                                        </div>

                                        {/* Date & Time */}
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>
                                                {new Date(booking.timeSlot.date).toLocaleDateString()} at{' '}
                                                {booking.timeSlot.startTime}
                                            </span>
                                        </div>

                                        {/* Payment Breakdown */}
                                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                            <div>
                                                <p className="text-gray-500">Total Booking</p>
                                                <p className="font-semibold">${booking.totalCost.toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Deposit (10%)</p>
                                                <p className="font-semibold text-blue-600">
                                                    ${booking.depositAmount.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Platform Fee</p>
                                                <p className="font-semibold text-green-600">
                                                    ${booking.platformFee.toFixed(2)}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500">Released</p>
                                                <p className="font-semibold text-purple-600">
                                                    ${releasedAmount.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status Badge */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                            Released
                                        </span>
                                        <span className="text-xs text-gray-500">
                                            {new Date(booking.updatedAt).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            Booking #{booking.bookingNumber}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
