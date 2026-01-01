"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { parseLocalDate, formatDateLocal } from "@/lib/utils/date-utils";
import { useAuth } from "@/lib/contexts/AuthContext";
import { renderAddress } from "@/lib/utils";

interface BookingFormProps {
    service: any;
    business: any;
}

export function ServiceBookingForm({ service, business }: BookingFormProps) {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading, refreshSession } = useAuth();
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
    const [selectedStaff, setSelectedStaff] = useState<string>("");
    const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; cost: number }>>([]);
    const [description, setDescription] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const isCurrentlyProcessing = useRef(false);
    const [dailyBookings, setDailyBookings] = useState<any[]>([]);

    const formatTime12Hour = (time24: string): string => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Fetch bookings for the selected date
    useEffect(() => {
        const fetchDailyBookings = async () => {
            if (!selectedDate) {
                setDailyBookings([]);
                return;
            }

            try {
                // Fetch all confirmed/pending bookings for this business on this date
                // Optimize: Filter by serviceId if needed, but fetching for business covers cross-service checks
                const businessId = typeof service.businessId === 'object' ? service.businessId.id || service.businessId._id : service.businessId;

                console.log('[ServiceBookingForm] Fetching bookings for:', { businessId, selectedDate });

                const response = await fetch(
                    `/api/bookings?businessId=${businessId}&date=${selectedDate}&status=confirmed,pending`,
                    {
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    // API returns {success, data: {bookings: [...]}} - need to access data.data.bookings
                    const bookings = data.data?.bookings || data.bookings || [];
                    console.log('[ServiceBookingForm] Fetched daily bookings:', bookings.length, bookings.map((b: any) => ({
                        staffId: b.staffId?._id || b.staffId,
                        startTime: b.timeSlot?.startTime,
                        endTime: b.timeSlot?.endTime,
                        status: b.status
                    })));
                    setDailyBookings(bookings);
                } else {
                    console.log('[ServiceBookingForm] Failed to fetch bookings:', response.status);
                }
            } catch (err) {
                console.error("Error fetching daily bookings:", err);
            }
        };

        fetchDailyBookings();
    }, [selectedDate, service.businessId]);

    // Helper to check if a staff member is busy at a specific time
    const isStaffBusy = (staffId: string, slotStartTime: string, slotEndTime: string) => {
        const result = dailyBookings.some((booking: any) => {
            // Check if booking belongs to this staff
            const bookingStaffId = typeof booking.staffId === 'object' ? booking.staffId._id || booking.staffId.id : booking.staffId;
            if (String(bookingStaffId) !== String(staffId)) return false;

            const bookingStart = booking.timeSlot.startTime;
            const bookingEnd = booking.timeSlot.endTime;

            // Check overlap
            const overlaps = (
                (slotStartTime >= bookingStart && slotStartTime < bookingEnd) ||
                (slotEndTime > bookingStart && slotEndTime <= bookingEnd) ||
                (slotStartTime <= bookingStart && slotEndTime >= bookingEnd)
            );

            if (overlaps) {
                console.log('[isStaffBusy] MATCH - Staff is busy:', {
                    staffId,
                    slotStartTime,
                    slotEndTime,
                    bookingStart,
                    bookingEnd,
                });
            }

            return overlaps;
        });

        console.log('[isStaffBusy] Check result for staff', staffId, ':', result, 'dailyBookings count:', dailyBookings.length);
        return result;
    };

    const availableDates: string[] = service.timeSlots && Array.isArray(service.timeSlots) && service.timeSlots.length > 0
        ? (() => {
            const dateStrings: string[] = service.timeSlots
                .filter((slot: any) => {
                    if (!slot || slot.isBooked) return false;
                    try {
                        const slotDate = parseLocalDate(slot.date);
                        if (isNaN(slotDate.getTime())) return false;
                        slotDate.setHours(0, 0, 0, 0);
                        return slotDate >= today;
                    } catch (e) {
                        return false;
                    }
                })
                .map((slot: any) => formatDateLocal(slot.date))
                .filter((date: string | null): date is string => date !== null);
            return [...new Set(dateStrings)].sort((a: string, b: string) =>
                parseLocalDate(a).getTime() - parseLocalDate(b).getTime()
            );
        })()
        : [];

    const availableTimeSlots = selectedDate
        ? (service.timeSlots || []).filter((slot: any) => {
            if (!slot || slot.isBooked) return false;
            try {
                const slotDateStr = formatDateLocal(slot.date);
                if (slotDateStr !== selectedDate) return false;

                const now = new Date();
                const slotDateTime = new Date(slot.date);
                const [hours, minutes] = slot.startTime.split(':').map(Number);
                slotDateTime.setHours(hours, minutes, 0, 0);

                if (slotDateTime <= now) return false;

                // ✅ Dynamic Availability Filtration
                // 1. Get all assigned staff for this slot
                const assignedStaff = slot.staffIds || [];
                if (assignedStaff.length === 0) return false; // Needs at least one staff

                // 2. Check if at least ONE staff member is free (not busy)
                // We use isStaffBusy against the pre-fetched dailyBookings
                const hasAvailableStaff = assignedStaff.some((s: any) => {
                    if (s.isBooked) return false; // Static check
                    const sId = typeof s.staffId === 'object' ? s.staffId._id : s.staffId;
                    return !isStaffBusy(String(sId), slot.startTime, slot.endTime); // Dynamic check
                });

                // If NO staff are available (all are either statically blocked or dynamically busy), hide the slot
                return hasAvailableStaff;
            } catch (e) {
                console.error("Error parsing slot date:", e, slot);
                return false;
            }
        })
        : [];

    const availableStaff = selectedTimeSlot?.staffIds
        ?.filter((staff: any) => {
            if (staff.isBooked) return false; // Already marked as booked in service data

            // Also filter out staff who are dynamically busy in other services
            const sId = staff.staffId.toString();
            const busy = isStaffBusy(sId, selectedTimeSlot.startTime, selectedTimeSlot.endTime);
            return !busy; // Only include staff who are NOT busy
        })
        ?.map((staff: any) => {
            const sId = staff.staffId.toString();
            return {
                id: sId,
                name: staff.staffDetails?.name || staff.name || "Staff",
            };
        }) || [];

    // Removed the old useEffect for checkStaffAvailability since we now pre-fetch dailyBookings

    const availableAddOns = selectedTimeSlot?.addOns && selectedTimeSlot.addOns.length > 0
        ? selectedTimeSlot.addOns
        : (service.addOns || []);

    const calculateTotal = () => {
        const slotPrice = selectedTimeSlot?.price || 0;
        const addOnsCost = selectedAddOns.reduce((sum, addon) => sum + addon.cost, 0);
        return slotPrice + addOnsCost;
    };

    const handleAddToCart = async () => {
        if (authLoading || isLoading || isCurrentlyProcessing.current) return;

        isCurrentlyProcessing.current = true;
        setIsLoading(true);
        setError("");

        // Double-check session if client thinks it's unauthenticated
        if (!isAuthenticated) {
            await refreshSession();
        }

        if (!isAuthenticated) {
            const returnUrl = window.location.pathname;
            localStorage.setItem("returnUrl", returnUrl);
            router.push(`/signin?redirect=${encodeURIComponent(returnUrl)}`);
            return;
        }

        if (!selectedDate || !selectedTimeSlot) {
            setError("Please select a date and time slot");
            setIsLoading(false);
            isCurrentlyProcessing.current = false;
            return;
        }

        const cartItem = {
            serviceId: service.id || service._id,
            businessId: typeof service.businessId === 'object'
                ? service.businessId.id || service.businessId._id
                : service.businessId,
            serviceName: service.serviceName,
            businessName: typeof service.businessId === 'object'
                ? service.businessId.businessName
                : business?.businessName || "Business",
            logo: typeof service.businessId === 'object'
                ? service.businessId.logo
                : business?.logo,
            date: selectedDate,
            time: `${formatTime12Hour(selectedTimeSlot.startTime)} - ${formatTime12Hour(selectedTimeSlot.endTime)}`,
            staffId: selectedStaff || undefined,
            staffName: availableStaff.find((s: any) => s.id === selectedStaff)?.name,
            baseCost: selectedTimeSlot?.price || 0,
            addOns: selectedAddOns,
            totalCost: calculateTotal(),
            address: renderAddress(service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address)),
            description: description,
        };

        const existingCart = localStorage.getItem("cart");
        const cart = existingCart ? JSON.parse(existingCart) : [];

        if (cart.length > 0) {
            const firstItem = cart[0];
            if (firstItem.businessId !== cartItem.businessId) {
                setError("You can only add services from one business at a time. Please checkout your current cart first.");
                return;
            }

            const hasTimeConflict = cart.some((item: any) => {
                if (item.date !== cartItem.date) return false;
                if (item.time === cartItem.time) return true;
                return false;
            });

            if (hasTimeConflict) {
                setError("You already have a booking at this date and time. Please choose a different time slot.");
                return;
            }
        }

        cart.push(cartItem);
        localStorage.setItem("cart", JSON.stringify(cart));
        router.push("/cart");
        // We leave isLoading=true as we are navigating away
    };

    return (
        <div className="space-y-6">
            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6">
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
            )}

            {/* Business Owner Name and Logo Header - Clickable */}
            {(business?.businessName || business?.logo) && (
                <div className="pb-4 border-b border-gray-200">
                    <Link
                        href={business?._id || business?.id ? `/business/${business._id || business.id}` : '#'}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
                    >
                        {business?.logo ? (
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-[#EECFD1] transition-colors flex-shrink-0">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={business.logo}
                                    alt={business.businessName || "Business Logo"}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 group-hover:bg-[#EECFD1]/20 transition-colors flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-bold text-gray-500 group-hover:text-[#EECFD1]">
                                    {(business?.businessName || 'B').charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] group-hover:text-[#EECFD1] transition-colors">
                                {business?.businessName || 'Booking'}
                            </h2>
                            {business?.businessName && (
                                <p className="text-xs text-gray-500 mt-0.5">Click to view business profile</p>
                            )}
                        </div>
                    </Link>
                </div>
            )}

            <div className="space-y-6">
                {/* Date Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Date
                    </label>
                    <div className="relative">
                        <select
                            value={selectedDate}
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                setSelectedTimeSlot(null);
                                setSelectedStaff("");
                            }}
                            className="w-full px-3 md:px-4 py-2.5 md:py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300"
                        >
                            <option value="">Select Date</option>
                            {availableDates.map((date: string) => {
                                const dateObj = new Date(date);
                                return (
                                    <option key={date} value={date}>
                                        {dateObj.toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric",
                                        })}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                    {availableDates.length === 0 && (
                        <div className="space-y-2">
                            <p className="text-sm text-amber-600 font-medium">
                                No available dates at this time
                            </p>
                            {(!service.timeSlots || service.timeSlots.length === 0) && (
                                <p className="text-xs text-muted-foreground">
                                    This service doesn&apos;t have any time slots configured yet.
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Time Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Time
                    </label>
                    <div className="relative">
                        <select
                            value={selectedTimeSlot ? `${selectedTimeSlot.startTime}-${selectedTimeSlot.endTime}` : ""}
                            onChange={(e) => {
                                const [start, end] = e.target.value.split("-");
                                const slot = availableTimeSlots.find(
                                    (s: any) => s.startTime === start && s.endTime === end
                                );
                                setSelectedTimeSlot(slot);
                                setSelectedStaff("");
                            }}
                            disabled={!selectedDate || availableTimeSlots.length === 0}
                            className="w-full px-3 md:px-4 py-2.5 md:py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">{selectedDate && availableTimeSlots.length > 0 ? "Select Preferred Time" : selectedDate ? "No time slots available" : "Select Date First"}</option>
                            {availableTimeSlots.map((slot: any, idx: number) => {
                                const start = new Date(`2000-01-01T${slot.startTime}`);
                                const end = new Date(`2000-01-01T${slot.endTime}`);
                                const durationMs = end.getTime() - start.getTime();
                                const hours = Math.floor(durationMs / (1000 * 60 * 60));
                                const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                                const duration = hours > 0 ? `${hours}hr${minutes > 0 ? ` ${minutes}mins` : ''}` : `${minutes}mins`;

                                return (
                                    <option
                                        key={idx}
                                        value={`${slot.startTime}-${slot.endTime}`}
                                    >
                                        {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)} {duration}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Staff Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-700 mb-2 block">
                        Staff
                    </label>
                    <div className="relative">
                        <select
                            value={selectedStaff}
                            onChange={(e) => setSelectedStaff(e.target.value)}
                            disabled={!selectedTimeSlot || availableStaff.length === 0}
                            className="w-full px-3 md:px-4 py-2.5 md:py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">{selectedTimeSlot && availableStaff.length > 0 ? "Select Preferred Staff" : selectedTimeSlot ? "No staff available" : "Select Time First"}</option>
                            {availableStaff.map((staff: any) => {
                                return (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.name}
                                    </option>
                                );
                            })}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>

                {/* Service Details Section */}
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            SERVICE
                        </label>
                        <p className="text-sm md:text-base font-bold text-[#3A3A3A]">{service.serviceName || ""}</p>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                            ADDRESS
                        </label>
                        <p className="text-sm text-[#3A3A3A]">
                            {renderAddress(service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address)) || ""}
                        </p>
                    </div>

                    {service.description && (
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                                DESCRIPTION
                            </label>
                            <p className="text-sm text-[#3A3A3A] leading-relaxed">{service.description}</p>
                        </div>
                    )}
                </div>

                {/* Add-ons - Always Visible */}
                {availableAddOns && availableAddOns.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Add-Ons
                        </label>
                        <select
                            value=""
                            onChange={(e) => {
                                if (e.target.value) {
                                    const addon = availableAddOns.find((a: any) => a.name === e.target.value);
                                    if (addon && !selectedAddOns.some((a) => a.name === addon.name)) {
                                        setSelectedAddOns([...selectedAddOns, { name: addon.name, cost: addon.cost || 0 }]);
                                    }
                                    e.target.value = "";
                                }
                            }}
                            disabled={!selectedTimeSlot}
                            className="w-full px-3 md:px-4 py-2.5 md:py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-4 pr-10 hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <option value="">{!selectedTimeSlot ? "Select Time First" : "Select Add-Ons"}</option>
                            {availableAddOns.map((addon: any, idx: number) => (
                                <option key={idx} value={addon.name}>
                                    {addon.name} - ${addon.cost?.toFixed(2) || "0.00"}
                                </option>
                            ))}
                        </select>
                        {selectedAddOns.length > 0 && (
                            <div className="mt-3 space-y-2 pl-1">
                                {selectedAddOns.map((addon, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-gray-100 group">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-700">{addon.name}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-semibold text-gray-900">${addon.cost.toFixed(2)}</span>
                                            <button
                                                onClick={() => {
                                                    setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
                                                }}
                                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
                                                title="Remove Add-on"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Pricing Summary */}
                <div className="space-y-4">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">PRICING SUMMARY</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Base Cost</span>
                            <span className="font-medium text-[#3A3A3A]">${(selectedTimeSlot?.price || 0).toFixed(2)}</span>
                        </div>
                        {selectedAddOns.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-gray-200">
                                {selectedAddOns.map((addon, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600">{addon.name}</span>
                                        <span className="font-medium text-[#3A3A3A]">+${addon.cost.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        <div className="flex justify-between items-center pt-4 border-t border-gray-300">
                            <span className="text-base font-bold text-[#3A3A3A]">Total</span>
                            <span className="text-xl md:text-2xl font-bold text-[#3A3A3A]">${calculateTotal().toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                {/* Book Now Button */}
                <Button
                    onClick={handleAddToCart}
                    disabled={isLoading || authLoading || !selectedDate || !selectedTimeSlot || availableDates.length === 0}
                    size="lg"
                    className="w-full h-12 md:h-14 rounded-xl bg-[#EECFD1] hover:bg-[#EECFD1]/90 text-[#3A3A3A] text-sm md:text-base font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isLoading || authLoading ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#3A3A3A] border-t-transparent mr-2" />
                            {authLoading ? "Initializing..." : "Processing..."}
                        </>
                    ) : availableDates.length === 0 ? (
                        "No Available Dates"
                    ) : !selectedDate ? (
                        "Select Date First"
                    ) : !selectedTimeSlot ? (
                        "Select Time First"
                    ) : (
                        "Book Now"
                    )}
                </Button>

                <p className="text-xs text-gray-500 text-center leading-relaxed pt-2">
                    10% Deposit paid today (includes $1.99 platform fee), remaining 90% paid at venue
                </p>
            </div>
        </div>
    );
}
