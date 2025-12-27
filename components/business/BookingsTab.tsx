"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard } from "@/components/ui/service-card";
import { Calendar } from "lucide-react";
import { parseLocalDate, formatDateLocal, formatDateForDisplay as formatDateDisplay } from "@/lib/utils/date-utils";

interface BookingsTabProps {
  business: any;
}

import { Booking } from "@/types/booking";

interface BookingsTabProps {
  business: any;
}

// Local interface removed in favor of imported type

export function BookingsTab({ business }: BookingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"up-coming" | "pending" | "finished">("up-coming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const lastRequestId = useRef(0);

  useEffect(() => {
    // Capture the current ID for cleanup
    // We don't actually need to capture it for *checking* in the interval/cleanup,
    // we just need to increment it to invalidate previous requests.
    // However, the lint rule complains about accessing .current in cleanup.
    // Let's just suppress safely or use a value.
    const currentId = lastRequestId.current;

    if (business?.id || business?._id) {
      loadBookings();
    }

    // Auto-refresh every minute
    const interval = setInterval(() => {
      if (business?.id || business?._id) {
        loadBookings();
      }
    }, 60000);

    return () => {
      // Cancel any pending callbacks by incrementing ID
      lastRequestId.current++;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, activeSubTab]);

  // ... (useEffect for date reset remains)

  // ... (month processing remains)

  // ... (navigation functions remain)

  const loadBookings = async () => {
    if (!business?.id && !business?._id) return;

    const requestId = ++lastRequestId.current;

    setIsLoading(true);
    setError("");
    try {
      const businessId = business.id || business._id;

      // ROOT FIX: Explicitly request valid statuses for each tab
      // This ensures 'pre_payment' bookings are never fetched
      let statusFilter = "";
      if (activeSubTab === "up-coming") {
        statusFilter = "confirmed";
      } else if (activeSubTab === "pending") {
        // Pending payouts can be for confirmed or completed bookings
        statusFilter = "confirmed,completed";
      } else if (activeSubTab === "finished") {
        statusFilter = "completed,cancelled,refunded";
      }

      const response = await fetch(
        `/api/bookings?businessId=${businessId}&status=${statusFilter}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include", // Use session cookies
        }
      );

      // Check if stale - if stale, do NOT update any state
      if (requestId !== lastRequestId.current) {
        // Don't update state for stale requests
        return;
      }

      if (response.ok) {
        const data = await response.json();
        // Check again after async json()
        if (requestId !== lastRequestId.current) {
          return;
        }

        // Handle both old (data.bookings) and new (data.data.bookings) response formats
        let filteredBookings = data.data?.bookings || data.bookings || [];

        // ✅ NORMALIZE: Ensure every booking has an 'id' property
        filteredBookings = filteredBookings.map((b: any) => ({
          ...b,
          id: b.id || (b._id ? String(b._id) : undefined)
        }));

        // Filter bookings based on new logic:
        const now = new Date();

        if (activeSubTab === "up-coming") {
          filteredBookings = filteredBookings.filter((b: Booking) => {
            try {
              // UPCOMING: Show CONFIRMED bookings (payment succeeded) only
              // We strictly only show bookings that have been paid for
              if (b.status !== "confirmed") {
                return false;
              }

              // Use parseLocalDate to avoid timezone issues
              const bookingDate = parseLocalDate(b.timeSlot.date);

              // Check if date is valid
              if (isNaN(bookingDate.getTime())) {
                return false;
              }

              // We compare dates at midnight to include "today" in upcoming
              const todayMidnight = new Date();
              todayMidnight.setHours(0, 0, 0, 0);

              const bookingMidnight = new Date(bookingDate);
              bookingMidnight.setHours(0, 0, 0, 0);

              // Upcoming = today or future dates
              return bookingMidnight.getTime() >= todayMidnight.getTime();
            } catch (error) {
              console.error('Error filtering booking:', error, b);
              return false;
            }
          });
        } else if (activeSubTab === "pending") {
          // PENDING: Confirmed or Completed bookings where admin hasn't released payment
          filteredBookings = filteredBookings.filter((b: Booking) => {
            return (b.status === "confirmed" || b.status === "completed") &&
              (b.adminPaymentStatus === "pending" || !b.adminPaymentStatus);
          });
        } else if (activeSubTab === "finished") {
          filteredBookings = filteredBookings.filter((b: Booking) =>
            b.adminPaymentStatus === "released"
          );
        }

        setBookings(filteredBookings);
        setIsLoading(false);
      } else {
        // Only set error if this is still the current request
        if (requestId === lastRequestId.current) {
          setError("Failed to load bookings");
          setIsLoading(false);
        }
      }
    } catch (e: any) {
      // Only handle error if this is still the current request
      if (requestId !== lastRequestId.current) {
        return;
      }
      if (e.name === "AbortError") {
        return;
      }
      console.error("Error loading bookings:", e);
      setError("Failed to load bookings");
      setIsLoading(false);
    }
  };


  useEffect(() => {
    setSelectedDate(null);
    setSelectedBooking(null);
    // Reset to current month when switching tabs
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
  }, [activeSubTab]);

  // Generate all dates for current month
  const monthDates = useMemo(() => {
    const dates: Array<{ date: Date; dateStr: string; day: number; weekday: string }> = [];
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = [
        date.getFullYear(),
        String(date.getMonth() + 1).padStart(2, '0'),
        String(date.getDate()).padStart(2, '0')
      ].join('-');
      dates.push({
        date,
        dateStr,
        day,
        weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
      });
    }
    return dates;
  }, [currentMonth, currentYear]);

  // Navigate months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const goToCurrentMonth = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
    setSelectedDate(null);
  };

  // Group bookings by service category
  const groupBookingsByCategory = (bookingsToGroup: Booking[]) => {
    const groups: Record<string, Booking[]> = {};

    bookingsToGroup.forEach((booking) => {
      const category = typeof booking.serviceId === 'object' && booking.serviceId?.category
        ? booking.serviceId.category
        : 'Other';

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(booking);
    });

    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
        body: JSON.stringify({
          status: "completed",
          paymentStatus: "fully_paid",
        }),
      });

      if (response.ok) {
        // Notify admin about completed booking
        try {
          await fetch("/api/admin/notifications", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Use session cookies
            body: JSON.stringify({
              type: "booking_completed",
              bookingId: bookingId,
              message: `Booking #${selectedBooking?.bookingNumber || bookingId.slice(-8)} has been marked as completed`,
            }),
          });
        } catch (notifyError) {
          console.error("Failed to notify admin:", notifyError);
          // Don't block the completion flow if notification fails
        }

        setSuccess("Booking completed successfully");
        loadBookings();
        setSelectedBooking(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to complete booking");
      }
    } catch (e) {
      console.error("Error completing booking:", e);
      setError("Failed to complete booking");
    }
  };

  const handleCancelBooking = async (bookingId: string, reason?: string) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason: reason || "Cancelled by business",
        }),
      });

      if (response.ok) {
        setSuccess("Booking cancelled successfully");
        loadBookings();
        setSelectedBooking(null);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to cancel booking");
      }
    } catch (e) {
      console.error("Error cancelling booking:", e);
      setError("Failed to cancel booking");
    }
  };

  const formatDate = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDateForInput = (dateString: string) => {
    return formatDateLocal(dateString);
  };

  const formatDateForDisplay = (dateString: string) => {
    return formatDateDisplay(dateString);
  };

  const formatTimeForDisplay = (time: string) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    if (isNaN(hour)) return time;
    const ampm = hour >= 12 ? 'pm' : 'am';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes || '00'} ${ampm}`;
  };

  const bookingsByDate = useMemo(() => {
    const grouped: Record<string, Booking[]> = {};
    bookings.forEach((booking) => {
      try {
        const dateKey = formatDateLocal(booking.timeSlot.date);
        if (!grouped[dateKey]) {
          grouped[dateKey] = [];
        }
        grouped[dateKey].push(booking);
      } catch (error) {
        console.error('Error grouping booking by date:', error, booking);
      }
    });
    return grouped;
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    if (!selectedDate) return bookings;
    const selectedDateStr = selectedDate.split('T')[0];
    return bookings.filter((booking) => {
      const bookingDateStr = booking.timeSlot.date.split('T')[0];
      return bookingDateStr === selectedDateStr;
    });
  }, [bookings, selectedDate]);

  // Get booking count for each date
  const getBookingCountForDate = (dateStr: string) => {
    return bookingsByDate[dateStr]?.length || 0;
  };

  const formatBookingForServiceCard = (booking: Booking) => {
    const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
    const businessData = typeof booking.businessId === 'object' ? booking.businessId : null;

    return {
      id: booking.id,
      name: service?.serviceName || 'Service',
      price: booking.totalCost,
      image: businessData?.logo || business?.logo || "/placeholder-logo.png",
      category: service?.category || '',
      businessName: businessData?.businessName || business?.businessName || 'Business',
      location: businessData?.address || business?.address || '',
      duration: service?.duration ? `${service.duration} min` : undefined,
      date: formatDateForDisplay(booking.timeSlot.date),
      time: `${formatTimeForDisplay(booking.timeSlot.startTime)} - ${formatTimeForDisplay(booking.timeSlot.endTime)}`,
      bookingNumber: booking.bookingNumber || null,
    };
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Sub-tabs */}
      <div className="flex border-b border-border/50">
        <button
          onClick={() => setActiveSubTab("up-coming")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeSubTab === "up-coming"
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
            }`}
        >
          Up-coming
          {activeSubTab === "up-coming" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("pending")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeSubTab === "pending"
            ? "text-red-500"
            : "text-muted-foreground hover:text-red-500"
            }`}
        >
          Pending
          {activeSubTab === "pending" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-red-500" />
          )}
        </button>
        <button
          onClick={() => setActiveSubTab("finished")}
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${activeSubTab === "finished"
            ? "text-green-600"
            : "text-muted-foreground hover:text-green-600"
            }`}
        >
          Finished
          {activeSubTab === "finished" && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600" />
          )}
        </button>
      </div>

      {/* Date Filter Section - Only for Upcoming */}
      {activeSubTab === "up-coming" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Up-coming</h3>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-8 w-8 p-0"
              >
                ←
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToCurrentMonth}
                className="h-8 px-3 text-xs"
              >
                {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-8 w-8 p-0"
              >
                →
              </Button>
            </div>
          </div>

          {/* Swipeable Date Picker - Cleaner Minimal Design */}
          <div className="relative border-b border-gray-100 pb-4">
            <div
              ref={(el) => {
                if (el) {
                  // Auto-scroll to today
                  const today = new Date();
                  const isCurrentMonth = today.getMonth() === currentMonth && today.getFullYear() === currentYear;

                  if (isCurrentMonth) {
                    const day = today.getDate();
                    // Center today: (DayIndex * ItemWidth) - (ContainerWidth / 2) + (ItemWidth / 2)
                    // ItemWidth approx 60px
                    const itemWidth = 60;
                    const scrollPos = (day - 1) * itemWidth - (el.offsetWidth / 2) + (itemWidth / 2);
                    el.scrollLeft = Math.max(0, scrollPos);
                  }
                }
              }}
              className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2"
              style={{
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {monthDates.map(({ date, dateStr, day, weekday }) => {
                const count = getBookingCountForDate(dateStr);
                const isSelected = selectedDate === dateStr;
                const isToday = dateStr === new Date().toISOString().split('T')[0];
                const isPast = date < new Date() && !isToday;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`flex flex-col items-center justify-center min-w-[50px] h-[70px] rounded-2xl transition-all duration-200 relative group ${isSelected
                      ? "bg-[#3A3A3A] text-white shadow-md transform scale-105"
                      : isPast
                        ? "text-gray-300"
                        : "text-gray-500 hover:bg-gray-50"
                      }`}
                  >
                    <span className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${isSelected ? 'text-white/80' : ''
                      }`}>
                      {weekday}
                    </span>
                    <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-[#3A3A3A]'
                      }`}>
                      {day}
                    </span>

                    {/* Dots for bookings */}
                    <div className="flex gap-0.5 mt-1 h-1">
                      {count > 0 && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#EECFD1]'
                          }`} />
                      )}
                      {count > 1 && (
                        <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#EECFD1]'
                          }`} />
                      )}
                      {count > 2 && (
                        <span className={`text-[6px] leading-none ${isSelected ? 'text-white' : 'text-[#EECFD1]'
                          }`}>+</span>
                      )}
                    </div>

                    {/* Today Indicator */}
                    {isToday && !isSelected && (
                      <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#EECFD1] rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="flex items-center justify-between p-3 bg-[#EECFD1]/10 rounded-xl border border-[#EECFD1]">
              <span className="text-sm font-medium text-[#3A3A3A]">
                {formatDateForDisplay(selectedDate)}: {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="text-xs text-gray-600 hover:text-[#3A3A3A]"
              >
                Clear
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : filteredBookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No {activeSubTab} bookings found{selectedDate ? ` for ${formatDateForDisplay(selectedDate)}` : ''}.</p>
            </div>
          ) : activeSubTab === "up-coming" ? (
            <div className="space-y-3">
              {filteredBookings.map((booking) => {
                const cardData = formatBookingForServiceCard(booking);
                return (
                  <div
                    key={booking.id}
                    onClick={() => setSelectedBooking(booking)}
                    className="cursor-pointer [&_a]:pointer-events-none"
                  >
                    <ServiceCard {...cardData} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${selectedBooking?.id === booking.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium">
                        {typeof booking.serviceId === 'object'
                          ? booking.serviceId.serviceName
                          : 'Service'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.timeSlot.date)} • {formatTime(booking.timeSlot.startTime)} - {formatTime(booking.timeSlot.endTime)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Booking #{booking.bookingNumber || booking.id.slice(-4)}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="font-semibold">${booking.totalCost.toFixed(2)}</p>
                      {booking.status === "pre_payment" && (
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Awaiting Payment
                        </span>
                      )}
                      {booking.status === "confirmed" && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Confirmed
                        </span>
                      )}
                      {booking.status === "completed" && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Booking Details */}
        {selectedBooking && (
          <div className="border rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {typeof selectedBooking.serviceId === 'object'
                    ? selectedBooking.serviceId.serviceName
                    : 'Service'}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Booking #{selectedBooking.bookingNumber || selectedBooking.id.slice(-8)}
                </p>
              </div>
              {selectedBooking.status === "cancelled" && (
                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                  Cancelled
                </span>
              )}
              {selectedBooking.status === "completed" && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  Completed
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date</p>
                <p>{formatDate(selectedBooking.timeSlot.date)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Time</p>
                <p>{formatTime(selectedBooking.timeSlot.startTime)} - {formatTime(selectedBooking.timeSlot.endTime)}</p>
              </div>
              {selectedBooking.staffId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Staff</p>
                  <p>{typeof selectedBooking.staffId === 'object' ? selectedBooking.staffId.name : 'N/A'}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Service</p>
                <p>
                  {(selectedBooking.serviceId && typeof selectedBooking.serviceId === 'object')
                    ? selectedBooking.serviceId.serviceName
                    : selectedBooking.serviceId || 'Service deleted'}
                </p>
                {(selectedBooking.serviceId && typeof selectedBooking.serviceId === 'object') && (
                  <p className="text-sm text-muted-foreground">{selectedBooking.serviceId.category}</p>
                )}
              </div>
              {(selectedBooking.userId && typeof selectedBooking.userId === 'object') && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p>{selectedBooking.userId.fname} {selectedBooking.userId.lname}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.userId.email}</p>
                  {selectedBooking.userId.contactNo && (
                    <p className="text-sm text-muted-foreground">{selectedBooking.userId.contactNo}</p>
                  )}
                </div>
              )}
              {!selectedBooking.userId && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p className="text-sm text-red-500">Account deleted</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Cost:</span>
                <span>${selectedBooking.totalCost.toFixed(2)}</span>
              </div>
              {selectedBooking.addOns && selectedBooking.addOns.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-1">Add-Ons:</p>
                  {selectedBooking.addOns.map((addon, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span>{addon.name}</span>
                      <span>${addon.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total Cost:</span>
                <span>${selectedBooking.totalCost.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium">Payments</p>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Paid 10% Deposit:</span>
                <span>${selectedBooking.depositAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>90% to Business:</span>
                <span>${selectedBooking.remainingAmount.toFixed(2)}</span>
              </div>
              {selectedBooking.status === "completed" && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>ouiimi pays 50% of Deposit:</span>
                  <span>${(selectedBooking.depositAmount * 0.5).toFixed(2)}</span>
                </div>
              )}
            </div>

            {selectedBooking.customerNotes && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Customer Notes:</p>
                <p className="text-sm">{selectedBooking.customerNotes}</p>
              </div>
            )}

            {activeSubTab === "pending" && selectedBooking.status !== "cancelled" && (
              <div className="flex gap-3">
                <Button
                  onClick={() => handleCompleteBooking(selectedBooking.id)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  Complete
                </Button>
                <Button
                  onClick={() => handleCancelBooking(selectedBooking.id)}
                  variant="outline"
                  className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            )}

            {activeSubTab === "up-coming" && selectedBooking.status !== "cancelled" && (
              <Button
                onClick={() => handleCancelBooking(selectedBooking.id)}
                variant="outline"
                className="w-full border-red-500 text-red-500 hover:bg-red-50"
              >
                Cancel Booking
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
