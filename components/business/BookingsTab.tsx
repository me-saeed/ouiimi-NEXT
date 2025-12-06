"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard } from "@/components/ui/service-card";
import { Calendar } from "lucide-react";

interface BookingsTabProps {
  business: any;
}

interface Booking {
  id: string;
  userId: any;
  serviceId: any;
  staffId: any;
  businessId?: any;
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  addOns: Array<{ name: string; cost: number }>;
  totalCost: number;
  depositAmount: number;
  remainingAmount: number;
  platformFee?: number;
  serviceAmount?: number;
  status: string;
  paymentStatus: string;
  adminPaymentStatus?: string;
  customerNotes?: string;
  businessNotes?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export function BookingsTab({ business }: BookingsTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"up-coming" | "pending" | "finished">("up-coming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (business?.id || business?._id) {
      loadBookings();
    }
    // Auto-refresh every minute to check for status transitions
    const interval = setInterval(() => {
      if (business?.id || business?._id) {
        loadBookings();
      }
    }, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business, activeSubTab]);

  useEffect(() => {
    setSelectedDate(null);
    setSelectedBooking(null);
  }, [activeSubTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showDatePicker && !target.closest('.date-picker-container')) {
        setShowDatePicker(false);
      }
    };
    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  const loadBookings = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;
      
      // For upcoming, get ALL bookings (no status filter) to check dates client-side
      // For pending/finished, we can filter by status on server
      let statusFilter = "";
      if (activeSubTab === "pending") {
        statusFilter = "confirmed"; // Pending are confirmed bookings with past dates
      } else if (activeSubTab === "finished") {
        // Finished are bookings with released payment status, not a status filter
        statusFilter = "";
      } else {
        // Upcoming: get all bookings, filter by date and status client-side
        statusFilter = ""; // No filter - we'll check status in client-side filter
      }

      const response = await fetch(
        `/api/bookings?businessId=${businessId}${statusFilter ? `&status=${statusFilter}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        let filteredBookings = data.bookings || [];

        // Filter bookings based on new logic:
        // Upcoming: Future bookings (service time hasn't passed)
        // Pending: Past bookings where admin hasn't released payment yet
        // Finished: Bookings where admin has released payment
        const now = new Date();
        
        if (activeSubTab === "up-coming") {
          filteredBookings = filteredBookings.filter((b: Booking) => {
            try {
              // Must be confirmed status
              if (b.status !== "confirmed") {
                return false;
              }
              
              // Handle date format - could be Date object, ISO string, or date string
              let bookingDate: Date;
              if (b.timeSlot.date instanceof Date) {
                bookingDate = b.timeSlot.date;
              } else if (typeof b.timeSlot.date === 'string') {
                // Parse the date string - could be ISO format or just date
                bookingDate = new Date(b.timeSlot.date);
              } else {
                return false;
              }
              
              // Check if date is valid
              if (isNaN(bookingDate.getTime())) {
                return false;
              }
              
              // Extract date part only (YYYY-MM-DD) from the booking date
              const dateStr = bookingDate.toISOString().split('T')[0];
              
              // Combine date with endTime (handle time format - might be HH:MM or HH:MM:SS)
              const endTime = (b.timeSlot.endTime || '').trim();
              if (!endTime) {
                return false;
              }
              
              // Ensure time is in HH:MM format
              const timeParts = endTime.split(':');
              const formattedTime = `${timeParts[0].padStart(2, '0')}:${timeParts[1] || '00'}`;
              
              // Create datetime string in local timezone and parse it
              // Use the date from the booking and combine with time
              const bookingDateTimeStr = `${dateStr}T${formattedTime}`;
              const bookingDateTime = new Date(bookingDateTimeStr);
              
              // If the date string doesn't include timezone, it's interpreted as local time
              // We need to compare in the same timezone context
              // Get the date components in local timezone
              const localYear = bookingDate.getFullYear();
              const localMonth = bookingDate.getMonth();
              const localDay = bookingDate.getDate();
              const [hours, minutes] = formattedTime.split(':').map(Number);
              
              // Create date in local timezone
              const localBookingDateTime = new Date(localYear, localMonth, localDay, hours, minutes);
              
              // Check if datetime is valid
              if (isNaN(localBookingDateTime.getTime())) {
                return false;
              }
              
              return localBookingDateTime > now;
            } catch (error) {
              console.error('Error filtering booking:', error, b);
              return false;
            }
          });
        } else if (activeSubTab === "pending") {
          filteredBookings = filteredBookings.filter((b: Booking) => {
            try {
              // Handle date format - could be Date object, ISO string, or date string
              let bookingDate: Date;
              if (b.timeSlot.date instanceof Date) {
                bookingDate = b.timeSlot.date;
              } else if (typeof b.timeSlot.date === 'string') {
                bookingDate = new Date(b.timeSlot.date);
              } else {
                return false;
              }
              
              if (isNaN(bookingDate.getTime())) {
                return false;
              }
              
              // Extract date part only (YYYY-MM-DD)
              const dateStr = bookingDate.toISOString().split('T')[0];
              
              // Combine date with endTime
              const endTime = b.timeSlot.endTime || '';
              const bookingDateTime = new Date(`${dateStr}T${endTime}`);
              
              if (isNaN(bookingDateTime.getTime())) {
                return false;
              }
              
              // Past bookings where admin payment is still pending
              return bookingDateTime <= now && 
                     b.status === "confirmed" && 
                     (b.adminPaymentStatus === "pending" || !b.adminPaymentStatus);
            } catch (error) {
              console.error('Error filtering booking:', error, b);
              return false;
            }
          });
        } else if (activeSubTab === "finished") {
          filteredBookings = filteredBookings.filter((b: Booking) => 
            b.adminPaymentStatus === "released"
          );
        }

        setBookings(filteredBookings);
      } else {
        setError("Failed to load bookings");
      }
    } catch (e) {
      console.error("Error loading bookings:", e);
      setError("Failed to load bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteBooking = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: "completed",
          paymentStatus: "fully_paid",
        }),
      });

      if (response.ok) {
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
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatDateForInput = (dateString: string) => {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
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
        let dateKey: string;
        if (booking.timeSlot.date instanceof Date) {
          dateKey = booking.timeSlot.date.toISOString().split('T')[0];
        } else if (typeof booking.timeSlot.date === 'string') {
          dateKey = booking.timeSlot.date.split('T')[0];
        } else {
          console.warn('Invalid date format in bookingsByDate:', booking.timeSlot.date);
          return;
        }
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

  const upcomingDates = useMemo(() => {
    const dates = Object.keys(bookingsByDate).sort();
    return dates.slice(0, 7);
  }, [bookingsByDate]);

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
      duration: service?.duration ? `${service.duration}mins` : undefined,
      date: formatDateForDisplay(booking.timeSlot.date),
      time: `${formatTimeForDisplay(booking.timeSlot.startTime)} - ${formatTimeForDisplay(booking.timeSlot.endTime)}`,
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
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeSubTab === "up-coming"
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
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeSubTab === "pending"
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
          className={`px-6 py-3 text-sm font-medium transition-colors relative ${
            activeSubTab === "finished"
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
            <div className="relative date-picker-container">
              <Button
                variant="outline"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="h-10 px-4 rounded-xl border-gray-200 text-[#3A3A3A] font-medium bg-white hover:bg-gray-50 flex items-center gap-2"
              >
                <Calendar className="w-4 h-4" />
                {selectedDate ? formatDateForDisplay(selectedDate) : "Select Date"}
              </Button>
              {showDatePicker && (
                <div className="absolute right-0 top-full mt-2 bg-white border rounded-lg shadow-lg z-10 p-4">
                  <input
                    type="date"
                    value={selectedDate || ''}
                    onChange={(e) => {
                      setSelectedDate(e.target.value || null);
                      setShowDatePicker(false);
                    }}
                    className="w-full p-2 border rounded"
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedDate(null);
                      setShowDatePicker(false);
                    }}
                    className="w-full mt-2"
                  >
                    Clear Filter
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Date Quick Select with Counts */}
          {!selectedDate && upcomingDates.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {upcomingDates.map((date) => {
                const count = bookingsByDate[date]?.length || 0;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className="flex flex-col items-center justify-center min-w-[60px] px-3 py-2 rounded-lg border border-gray-200 hover:border-primary hover:bg-primary/5 transition-colors"
                  >
                    <span className="text-xs text-muted-foreground">
                      {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                    <span className="text-lg font-semibold">
                      {new Date(date).getDate()}
                    </span>
                    <span className="text-xs text-primary font-medium">{count}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Selected Date Info */}
          {selectedDate && (
            <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
              <span className="text-sm font-medium">
                {formatDateForDisplay(selectedDate)}: {filteredBookings.length} {filteredBookings.length === 1 ? 'booking' : 'bookings'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate(null)}
                className="text-xs"
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
            bookings.map((booking) => (
              <div
                key={booking.id}
                onClick={() => setSelectedBooking(booking)}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedBooking?.id === booking.id
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
                      Booking ID: {booking.id.slice(-4)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">${booking.totalCost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground capitalize">{booking.status}</p>
                  </div>
                </div>
              </div>
            ))
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
                  Booking ID: {selectedBooking.id.slice(-8)}
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
              {typeof selectedBooking.userId === 'object' && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Customer</p>
                  <p>{selectedBooking.userId.fname} {selectedBooking.userId.lname}</p>
                  <p className="text-sm text-muted-foreground">{selectedBooking.userId.email}</p>
                  {selectedBooking.userId.contactNo && (
                    <p className="text-sm text-muted-foreground">{selectedBooking.userId.contactNo}</p>
                  )}
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
