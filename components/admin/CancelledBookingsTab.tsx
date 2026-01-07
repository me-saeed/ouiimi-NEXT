"use client";

import { useState } from "react";
import useSWR from "swr";
import { Booking } from "@/types/booking";
import { User, Store, CalendarX, AlertCircle } from "lucide-react";

interface CancelledBookingsTabProps {
    // We can fetch data internally or pass it in. Internally is easier for sub-tabs to manage their own state if needed.
    // But for consistency with page.tsx, we might want to pass it.
    // Given the sub-tab requirement ("By Business" and "By Shopper"), internal fetching or filtering is best.
}

export function CancelledBookingsTab() {
    const [subTab, setSubTab] = useState<"business" | "customer">("business");

    // Fetch logic
    // We can fetch all cancelled and filter client side OR fetch by type. 
    // Fetching by type is scalable.
    const { data, error, isLoading } = useSWR(
        `/api/admin/bookings/cancelled?type=${subTab}`,
        (url: string) => fetch(url).then((res) => res.json())
    );

    const bookings = data?.data?.bookings || [];

    return (
        <div className="space-y-6">
            {/* Sub-tabs Header */}
            <div className="flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setSubTab("business")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${subTab === "business"
                        ? "text-[#3A3A3A] border-b-2 border-[#3A3A3A]"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Cancelled by Business
                </button>
                <button
                    onClick={() => setSubTab("customer")}
                    className={`pb-3 px-1 text-sm font-medium transition-colors relative ${subTab === "customer"
                        ? "text-[#3A3A3A] border-b-2 border-[#3A3A3A]"
                        : "text-gray-500 hover:text-gray-700"
                        }`}
                >
                    Cancelled by Shopper
                </button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-[#EECFD1] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-gray-500 font-medium">Loading cancelled bookings...</p>
                    </div>
                </div>
            ) : bookings.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No bookings cancelled by {subTab === 'business' ? 'Business Owner' : 'Shopper'} found.
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {bookings.map((booking: Booking) => (
                        <CancelledBookingCard key={booking.id} booking={booking} type={subTab} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CancelledBookingCard({ booking, type }: { booking: Booking; type: "business" | "customer" }) {
    const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
    const business = typeof booking.businessId === 'object' ? booking.businessId : null;
    const shopper = typeof booking.userId === 'object' ? booking.userId : null;

    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col h-full">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">{service?.serviceName || 'Service'}</h3>
                    <p className="text-sm text-gray-600 line-clamp-1">{business?.businessName || 'Business'}</p>
                </div>
                <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs font-bold whitespace-nowrap">
                    Cancelled
                </span>
            </div>

            <div className="space-y-3 flex-grow">
                {/* Date & Time */}
                <div className="flex items-center text-sm text-gray-600">
                    <CalendarX className="w-4 h-4 mr-2 text-gray-400" />
                    <span>
                        {new Date(booking.timeSlot.date).toLocaleDateString()} at {booking.timeSlot.startTime}
                    </span>
                </div>

                {/* Reason */}
                {booking.cancellationReason && (
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">
                        <p className="text-xs text-gray-400 font-bold uppercase mb-1">Reason provided</p>
                        <p className="text-gray-700 italic">&ldquo;{booking.cancellationReason}&rdquo;</p>
                    </div>
                )}

                {/* Shopper Details */}
                <div className="flex items-start p-3 border border-gray-100 rounded-lg bg-gray-50/50">
                    <User className="w-4 h-4 text-gray-400 mr-2 mt-0.5" />
                    <div>
                        <p className="text-xs text-gray-500 font-bold uppercase mb-0.5">Shopper</p>
                        <p className="text-sm font-medium text-gray-900">{shopper?.fname} {shopper?.lname}</p>
                        <p className="text-xs text-gray-500">{shopper?.email}</p>
                    </div>
                </div>

                {/* Financial Summary */}
                <div className="pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="text-xs text-gray-500">Booking Value</p>
                        <p className="font-semibold text-gray-900">${booking.totalCost.toFixed(2)}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Deposit Paid</p>
                        <p className="font-semibold text-gray-900">${(booking.depositAmount || booking.totalCost * 0.1).toFixed(2)}</p>
                    </div>
                </div>

                {/* Policy Note */}
                <div className="mt-2 flex items-start gap-2 text-xs text-gray-500">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <p>
                        {type === 'customer'
                            ? "Shopper cancelled. 50% refund applies (check Refunds tab)."
                            : "Business cancelled. Full refund to shopper required if deposit taken (handled automatically via Stripe if configured, else manual)."}
                    </p>
                </div>
            </div>
        </div>
    );
}
