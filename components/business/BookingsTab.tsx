"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BookingsTabProps {
  business: any;
}

interface Booking {
  id: string;
  userId: any;
  serviceId: any;
  staffId: any;
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  addOns: Array<{ name: string; cost: number }>;
  totalCost: number;
  depositAmount: number;
  remainingAmount: number;
  status: string;
  paymentStatus: string;
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

  const loadBookings = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;
      
      let statusFilter = "";
      if (activeSubTab === "up-coming") {
        statusFilter = "confirmed";
      } else if (activeSubTab === "pending") {
        statusFilter = "pending";
      } else if (activeSubTab === "finished") {
        statusFilter = "completed";
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

        // Filter by date for up-coming (future dates) and pending (past dates)
        const now = new Date();
        if (activeSubTab === "up-coming") {
          filteredBookings = filteredBookings.filter((b: Booking) => {
            const bookingDate = new Date(b.timeSlot.date);
            const bookingDateTime = new Date(`${b.timeSlot.date}T${b.timeSlot.endTime}`);
            return bookingDateTime > now && b.status === "confirmed";
          });
        } else if (activeSubTab === "pending") {
          filteredBookings = filteredBookings.filter((b: Booking) => {
            const bookingDateTime = new Date(`${b.timeSlot.date}T${b.timeSlot.endTime}`);
            return bookingDateTime <= now && (b.status === "confirmed" || b.status === "pending");
          });
        } else if (activeSubTab === "finished") {
          filteredBookings = filteredBookings.filter((b: Booking) => 
            b.status === "completed" || b.status === "cancelled"
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

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bookings List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No {activeSubTab} bookings found.</p>
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
