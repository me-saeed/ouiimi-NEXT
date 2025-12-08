"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";

interface Booking {
  id: string;
  businessId: any;
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
  cancelledAt?: string;
  cancellationReason?: string;
}

export default function ShopperProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"upcoming" | "pending" | "finished" | "details">("upcoming");
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [finishedBookings, setFinishedBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showContact, setShowContact] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    // Check for success message from cart
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      setSuccess("Booking completed successfully!");
      setTimeout(() => setSuccess(""), 5000);
      // Clean URL
      window.history.replaceState({}, "", "/profile");
    }
  }, []);

  // User details form
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    number: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (!token || !userData) {
      router.push("/signin");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
      setUserDetails({
        name: `${parsedUser.fname || ""} ${parsedUser.lname || ""}`.trim(),
        email: parsedUser.email || "",
        number: parsedUser.contactNo || "",
      });
      loadBookings(parsedUser);
    } catch (e) {
      console.error("Error parsing user data:", e);
      router.push("/signin");
    }
  }, [router]);

  const loadBookings = async (userData: any) => {
    if (!userData?.id && !userData?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const userId = userData.id || userData._id;

      const response = await fetch(`/api/bookings?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const allBookings = data.bookings || [];

        const now = new Date();
        const upcoming: Booking[] = [];
        const pending: Booking[] = [];
        const finished: Booking[] = [];

        allBookings.forEach((booking: Booking) => {
          const bookingDateTime = new Date(`${booking.timeSlot.date}T${booking.timeSlot.endTime}`);
          const isPast = bookingDateTime <= now;

          // Finished: payment transferred (fully_paid) or cancelled/completed
          if (booking.status === "cancelled" || booking.status === "completed" || booking.paymentStatus === "fully_paid") {
            finished.push(booking);
          }
          // Pending: appointment time passed but payment not transferred
          else if (isPast && booking.paymentStatus !== "fully_paid") {
            pending.push(booking);
          }
          // Upcoming: appointment time hasn't passed
          else if (!isPast && (booking.status === "confirmed" || booking.status === "pending")) {
            upcoming.push(booking);
          }
        });

        // Sort upcoming by date (closest first)
        upcoming.sort((a, b) => {
          const dateA = new Date(`${a.timeSlot.date}T${a.timeSlot.startTime}`);
          const dateB = new Date(`${b.timeSlot.date}T${b.timeSlot.startTime}`);
          return dateA.getTime() - dateB.getTime();
        });

        // Sort pending by date (most recent first)
        pending.sort((a, b) => {
          const dateA = new Date(`${a.timeSlot.date}T${a.timeSlot.startTime}`);
          const dateB = new Date(`${b.timeSlot.date}T${b.timeSlot.startTime}`);
          return dateB.getTime() - dateA.getTime();
        });

        // Sort finished by date (most recent first)
        finished.sort((a, b) => {
          const dateA = new Date(`${a.timeSlot.date}T${a.timeSlot.startTime}`);
          const dateB = new Date(`${b.timeSlot.date}T${b.timeSlot.startTime}`);
          return dateB.getTime() - dateA.getTime();
        });

        setUpcomingBookings(upcoming);
        setPendingBookings(pending);
        setFinishedBookings(finished);
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

  const handleCancelBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to cancel this booking? You will lose your 10% deposit + ouiimi fee.")) {
      return;
    }

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
          cancellationReason: "Cancelled by customer",
          cancelledBy: "customer",
        }),
      });

      if (response.ok) {
        setSuccess("Booking cancelled successfully");
        setSelectedBooking(null);
        if (user) loadBookings(user);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to cancel booking");
      }
    } catch (e) {
      console.error("Error cancelling booking:", e);
      setError("Failed to cancel booking");
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm("Are you sure you want to delete this booking? This action cannot be undone.")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess("Booking deleted successfully");
        setSelectedBooking(null);
        if (user) loadBookings(user);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete booking");
      }
    } catch (e) {
      console.error("Error deleting booking:", e);
      setError("Failed to delete booking");
    }
  };

  const handleRescheduleBooking = async (bookingId: string, newTimeSlot: { date: string; startTime: string; endTime: string }) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeSlot: newTimeSlot,
        }),
      });

      if (response.ok) {
        setSuccess("Booking rescheduled successfully");
        setSelectedBooking(null);
        if (user) loadBookings(user);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to reschedule booking");
      }
    } catch (e) {
      console.error("Error rescheduling booking:", e);
      setError("Failed to reschedule booking");
    }
  };

  const handleRebook = (booking: Booking) => {
    const businessId = typeof booking.businessId === 'object'
      ? booking.businessId.id || booking.businessId._id
      : booking.businessId;

    if (businessId) {
      router.push(`/business/${businessId}`);
    }
  };

  const handleSaveDetails = async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = user?.id || user?._id;

      const [fname, ...lnameParts] = userDetails.name.split(" ");
      const lname = lnameParts.join(" ") || "";

      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fname: fname || user.fname,
          lname: lname || user.lname,
          email: userDetails.email || user.email,
          contactNo: userDetails.number || user.contactNo,
        }),
      });

      if (response.ok) {
        setSuccess("Details saved successfully");
        const updatedUser = { ...user, fname, lname, email: userDetails.email, contactNo: userDetails.number };
        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to save details");
      }
    } catch (e) {
      console.error("Error saving details:", e);
      setError("Failed to save details");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const formatTime = (time: string) => {
    return time;
  };

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period.toLowerCase()}`;
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString);
    return `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getFullYear()).slice(-2)}`;
  };

  const formatBookingForServiceCard = (booking: Booking) => {
    const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
    const businessData = typeof booking.businessId === 'object' ? booking.businessId : null;
    
    // Calculate duration from time slot
    const startTime = booking.timeSlot.startTime;
    const endTime = booking.timeSlot.endTime;
    let duration = "";
    if (startTime && endTime) {
      const [startHours, startMins] = startTime.split(":").map(Number);
      const [endHours, endMins] = endTime.split(":").map(Number);
      const startTotal = startHours * 60 + startMins;
      const endTotal = endHours * 60 + endMins;
      const diffMins = endTotal - startTotal;
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      if (hours > 0) {
        duration = `${hours}Hr${mins > 0 ? ` ${mins}mins` : ''}`;
      } else {
        duration = `${mins}mins`;
      }
    }
    
    return {
      id: booking.id,
      name: service?.serviceName || 'Service',
      price: booking.totalCost,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service?.category || '',
      businessName: businessData?.businessName || 'Business',
      location: businessData?.address || '',
      duration: duration || undefined,
      date: formatDateForDisplay(booking.timeSlot.date),
      time: `${formatTime12Hour(booking.timeSlot.startTime)} - ${formatTime12Hour(booking.timeSlot.endTime)}`,
      bookingId: booking.id,
    };
  };

  const getFilteredBookings = () => {
    let bookingsToFilter: Booking[] = [];

    if (activeTab === "upcoming") {
      bookingsToFilter = upcomingBookings;
    } else if (activeTab === "pending") {
      bookingsToFilter = pendingBookings;
    } else if (activeTab === "finished") {
      bookingsToFilter = finishedBookings;
    }

    if (selectedDate) {
      return bookingsToFilter.filter((b) => {
        const bookingDate = new Date(b.timeSlot.date);
        return bookingDate.toDateString() === selectedDate.toDateString();
      });
    }
    return bookingsToFilter;
  };

  if (!user) {
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-background min-h-screen">
        {/* Profile Header */}
        <div className="bg-white py-8 border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {user.pic && user.pic !== "avatar.png" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.pic}
                    alt={user.fname}
                    className="w-24 h-24 rounded-full object-cover border-4 border-[#EECFD1] shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[#EECFD1] border-4 border-white shadow-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.fname?.charAt(0) || "U"}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold hover:bg-primary/90">
                  +
                </button>
              </div>

              <h2 className="text-xl font-medium text-foreground">
                {user.fname} {user.lname}
              </h2>

              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Calendar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-border/50 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center w-full max-w-4xl mx-auto">
              <button
                onClick={() => setActiveTab("upcoming")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "upcoming"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Upcoming
                {activeTab === "upcoming" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "pending"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Pending
                {activeTab === "pending" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("finished")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "finished"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Finished
                {activeTab === "finished" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "details"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Details
                {activeTab === "details" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {success && (
            <Alert className="bg-green-50 border-green-200 mb-6">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {(activeTab === "upcoming" || activeTab === "pending" || activeTab === "finished") && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : getFilteredBookings().length === 0 ? (
                <div className="text-center py-12 card-polished">
                  <p className="text-muted-foreground">
                    {activeTab === "upcoming" && "No upcoming bookings found."}
                    {activeTab === "pending" && "No pending bookings found."}
                    {activeTab === "finished" && "No finished bookings found."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Cards */}
                  <div className="space-y-3">
                    {getFilteredBookings().map((booking) => {
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

                  {/* Booking Details */}
                  {selectedBooking && (
                    <BookingDetailView
                      booking={selectedBooking}
                      onCancel={() => handleCancelBooking(selectedBooking.id)}
                      onDelete={() => handleDeleteBooking(selectedBooking.id)}
                      onReschedule={(newTimeSlot) => handleRescheduleBooking(selectedBooking.id, newTimeSlot)}
                      onContact={() => setShowContact(true)}
                      showContact={showContact}
                      onCloseContact={() => setShowContact(false)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "finished" && (
            <div className="space-y-6">
              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : finishedBookings.length === 0 ? (
                <div className="text-center py-12 card-polished">
                  <p className="text-muted-foreground">No finished bookings found.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    {finishedBookings.map((booking) => {
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

                  {selectedBooking && (
                    <FinishedBookingDetailView
                      booking={selectedBooking}
                      onRebook={() => handleRebook(selectedBooking)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "details" && (
            <div className="max-w-2xl mx-auto">
              <div className="card-polished p-6 space-y-4">
                <h2 className="text-xl font-semibold mb-4">Your Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Name</label>
                    <Input
                      value={userDetails.name}
                      onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                      placeholder="Your full name"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <Input
                      type="email"
                      value={userDetails.email}
                      onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Number</label>
                    <Input
                      value={userDetails.number}
                      onChange={(e) => setUserDetails({ ...userDetails, number: e.target.value })}
                      placeholder="0412345678"
                    />
                  </div>
                  <Button onClick={handleSaveDetails} className="btn-polished-primary">
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// Booking Detail View Component
function BookingDetailView({
  booking,
  onCancel,
  onDelete,
  onReschedule,
  onContact,
  showContact,
  onCloseContact,
}: {
  booking: Booking;
  onCancel: () => void;
  onDelete: () => void;
  onReschedule: (newTimeSlot: { date: string; startTime: string; endTime: string }) => void;
  onContact: () => void;
  showContact: boolean;
  onCloseContact: () => void;
}) {
  const [showReschedule, setShowReschedule] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="card-polished p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {typeof booking.businessId === 'object' && booking.businessId.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.businessId.logo}
              alt={booking.businessId.businessName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {typeof booking.businessId === 'object'
                  ? booking.businessId.businessName?.charAt(0) || "B"
                  : "B"}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {typeof booking.businessId === 'object'
                ? booking.businessId.businessName
                : "Business"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Booking ID: {booking.id.slice(-8)}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Date</p>
          <p>{formatDate(booking.timeSlot.date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Service</p>
          <p>{typeof booking.serviceId === 'object' ? booking.serviceId.serviceName : "Service"}</p>
        </div>
        {booking.staffId && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Staff</p>
            <p>{typeof booking.staffId === 'object' ? booking.staffId.name : "N/A"}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Time</p>
          <p>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</p>
        </div>
        {typeof booking.businessId === 'object' && booking.businessId.address && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{booking.businessId.address}</p>
          </div>
        )}
      </div>

      {booking.customerNotes && (
        <div>
          <p className="text-sm font-medium text-muted-foreground mb-1">Description</p>
          <p className="text-sm">{booking.customerNotes}</p>
        </div>
      )}

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Cost:</span>
          <span>${booking.totalCost.toFixed(2)}</span>
        </div>
        {booking.addOns && booking.addOns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Add-Ons:</p>
            {booking.addOns.map((addon, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{addon.name}</span>
                <span>${addon.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total Cost:</span>
          <span>${booking.totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <p className="text-sm font-medium">Payments</p>
        <div className="flex justify-between text-sm text-green-600">
          <span>Paid 10% Deposit + $1.99 ouiimi fee:</span>
          <span>${(booking.depositAmount + 1.99).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>90% paid to directly Business:</span>
          <span>${booking.remainingAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex gap-3">
          <Button
            onClick={() => setShowReschedule(!showReschedule)}
            variant="outline"
            className="flex-1"
          >
            {showReschedule ? "Cancel Reschedule" : "Reschedule"}
          </Button>
          <Button
            onClick={onContact}
            variant="outline"
            className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
          >
            Contact
          </Button>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
          >
            Cancel Booking
          </Button>
          <Button
            onClick={onDelete}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
          >
            Delete
          </Button>
        </div>
      </div>

      {showReschedule && (
        <div className="border-t pt-4 mt-4 space-y-4">
          <h4 className="font-semibold">Reschedule Booking</h4>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">New Date</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Time</label>
              <input
                type="time"
                value={newStartTime}
                onChange={(e) => setNewStartTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Time</label>
              <input
                type="time"
                value={newEndTime}
                onChange={(e) => setNewEndTime(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </div>
          </div>
          <Button
            onClick={() => {
              if (newDate && newStartTime && newEndTime) {
                onReschedule({
                  date: newDate,
                  startTime: newStartTime,
                  endTime: newEndTime,
                });
                setShowReschedule(false);
              }
            }}
            disabled={!newDate || !newStartTime || !newEndTime}
            className="w-full btn-polished-primary"
          >
            Confirm Reschedule
          </Button>
        </div>
      )}

      {showContact && (
        <ContactView
          business={booking.businessId}
          onClose={onCloseContact}
        />
      )}
    </div>
  );
}

// Finished Booking Detail View Component
function FinishedBookingDetailView({
  booking,
  onRebook,
}: {
  booking: Booking;
  onRebook: () => void;
}) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="card-polished p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {typeof booking.businessId === 'object' && booking.businessId.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={booking.businessId.logo}
              alt={booking.businessId.businessName}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {typeof booking.businessId === 'object'
                  ? booking.businessId.businessName?.charAt(0) || "B"
                  : "B"}
              </span>
            </div>
          )}
          <div>
            <h3 className="text-lg font-semibold">
              {typeof booking.businessId === 'object'
                ? booking.businessId.businessName
                : "Business"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Booking ID: {booking.id.slice(-8)}
            </p>
          </div>
        </div>
        {booking.status === "cancelled" && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            Cancelled
          </span>
        )}
        {booking.status === "completed" && (
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            Completed
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Date</p>
          <p>{formatDate(booking.timeSlot.date)}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">Service</p>
          <p>{typeof booking.serviceId === 'object' ? booking.serviceId.serviceName : "Service"}</p>
        </div>
        {booking.staffId && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Staff</p>
            <p>{typeof booking.staffId === 'object' ? booking.staffId.name : "N/A"}</p>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Time</p>
          <p>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</p>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between">
          <span>Cost:</span>
          <span>${booking.totalCost.toFixed(2)}</span>
        </div>
        {booking.addOns && booking.addOns.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-1">Add-Ons:</p>
            {booking.addOns.map((addon, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span>{addon.name}</span>
                <span>${addon.cost.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-between font-semibold border-t pt-2">
          <span>Total Cost:</span>
          <span>${booking.totalCost.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t pt-4 space-y-2">
        <p className="text-sm font-medium">Payments</p>
        <div className="flex justify-between text-sm">
          <span>Customer Paid 10% Deposit:</span>
          <span>${booking.depositAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>90% paid to directly Business:</span>
          <span>${booking.remainingAmount.toFixed(2)}</span>
        </div>
        {booking.status === "completed" && (
          <div className="flex justify-between text-sm text-green-600">
            <span>ouiimi pays 50% of Deposit after completion:</span>
            <span>${(booking.depositAmount * 0.5).toFixed(2)}</span>
          </div>
        )}
      </div>

      <Button
        onClick={onRebook}
        variant="outline"
        className="w-full border-red-500 text-red-500 hover:bg-red-50"
      >
        Rebook
      </Button>
    </div>
  );
}

// Contact View Component
function ContactView({
  business,
  onClose,
}: {
  business: any;
  onClose: () => void;
}) {
  return (
    <div className="border-t pt-4 mt-4 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">Contact Information</h4>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          ×
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card-polished p-4">
          <h5 className="font-medium mb-3">Admin</h5>
          <div className="space-y-1 text-sm">
            <p><span className="font-medium">Name:</span> ouiimi Team</p>
            <p><span className="font-medium">Email:</span> ouiimi@outlook.com</p>
            <p><span className="font-medium">Number:</span> 0466006171</p>
          </div>
        </div>

        {typeof business === 'object' && (
          <div className="card-polished p-4">
            <h5 className="font-medium mb-3">Business</h5>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {business.businessName || "N/A"}</p>
              <p><span className="font-medium">Email:</span> {business.email || "N/A"}</p>
              <p><span className="font-medium">Number:</span> {business.phone || "N/A"}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
