"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { InlineDatePicker } from "@/components/ui/InlineDatePicker";
import { Calendar } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";
import { useRef } from "react";
import { ImageUpload } from "@/components/ui/image-upload";
import { useAuth } from "@/lib/contexts/AuthContext";
import { renderAddress } from "@/lib/utils";

import { Booking } from "@/types/booking";

export default function ShopperProfilePage() {
  const router = useRouter();
  const { user, setUser, isLoading: authLoading, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<"upcoming" | "finished" | "details">("upcoming");
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [finishedBookings, setFinishedBookings] = useState<Booking[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showContact, setShowContact] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [isMobile, setIsMobile] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check for success message from cart
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("success") === "true") {
      router.refresh(); // Ensure fresh data on redirect
      setSuccess("Booking completed successfully!");
      setTimeout(() => setSuccess(""), 5000);
      // Clean URL
      window.history.replaceState({}, "", "/profile");
    }
  }, [router]);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // User details form
  const [userDetails, setUserDetails] = useState({
    name: "",
    email: "",
    number: "",
  });

  useEffect(() => {
    if (authLoading) return;

    if (!isAuthenticated || !user) {
      router.push("/signin?redirect=/profile");
      return;
    }

    setUserDetails({
      name: `${user.fname || ""} ${user.lname || ""}`.trim(),
      email: user.email || "",
      number: user.contactNo || user.phone || "",
    });
    loadBookings(user);
  }, [authLoading, isAuthenticated, user, router]);

  const handleUpdateProfilePic = async (url: string) => {
    try {
      if (!user) return;

      const userId = user.id || user._id;

      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          pic: url,
        }),
      });

      if (response.ok) {
        setSuccess("Profile picture updated successfully");
        const updatedUser = user ? { ...user, pic: url } : null;
        if (updatedUser) {
          localStorage.setItem("user", JSON.stringify(updatedUser));
          setUser(updatedUser);
        }
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Failed to update profile picture");
      }
    } catch (e) {
      console.error("Error updating profile picture:", e);
      setError("Failed to update profile picture");
    }
  };



  const loadBookings = async (userData: any) => {
    if (!userData?.id && !userData?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const userId = userData.id || userData._id;

      // ROOT FIX: Explicitly request valid statuses
      // We only want confirmed (paid), completed, or cancelled bookings.
      // Never show pre_payment (unpaid/in-progress) bookings.
      const statusFilter = "confirmed,completed,cancelled,refunded";

      const response = await fetch(`/api/bookings?userId=${userId}&status=${statusFilter}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (response.ok) {
        const result = await response.json();
        // Standardized API response puts data in 'data' field
        let allBookings = result.data?.bookings || result.bookings || [];

        // ✅ NORMALIZE: Ensure every booking has an 'id' property
        allBookings = allBookings.map((b: any) => ({
          ...b,
          id: b.id || b._id
        }));

        const now = new Date();
        const upcoming: Booking[] = [];
        const pending: Booking[] = [];
        const finished: Booking[] = [];

        allBookings.forEach((booking: Booking) => {
          // UPCOMING: Only show CONFIRMED bookings (payment succeeded)
          // Exclude pre_payment (not yet paid/abandoned carts)
          if (booking.status === "confirmed") {
            try {
              // Parse booking date
              const bookingDate = new Date(booking.timeSlot.date);

              // Parse end time (format: "HH:MM" or "HH:MM:SS")
              const endTimeParts = booking.timeSlot.endTime.split(':');
              const endHour = parseInt(endTimeParts[0], 10);
              const endMinute = parseInt(endTimeParts[1] || '0', 10);

              // Create a date object with the booking date and end time
              const bookingEndDateTime = new Date(bookingDate);
              bookingEndDateTime.setHours(endHour, endMinute, 0, 0);

              // Check if the booking end time has passed
              const isPast = now > bookingEndDateTime;

              // If booking end time has passed, move to finished
              if (isPast) {
                finished.push(booking);
              } else {
                // Future confirmed booking = upcoming
                upcoming.push(booking);
              }
            } catch (error) {
              console.error('Error processing booking:', error, booking);
              // If there's an error parsing, default to upcoming to be safe
              upcoming.push(booking);
            }
          }
          // FINISHED: Cancelled, completed, refunded, or any other status
          else if (booking.status === "cancelled" || booking.status === "completed" || booking.status === "refunded") {
            finished.push(booking);
          }
          // Skip pre_payment and other statuses (don't show to user)
        });

        // Helper function for sorting bookings by date/time
        const getSlotDateTime = (b: Booking) => {
          try {
            const datePart = b.timeSlot.date.split('T')[0];
            return new Date(`${datePart}T${b.timeSlot.startTime}`).getTime();
          } catch (e) {
            return new Date(b.timeSlot.date).getTime();
          }
        };

        upcoming.sort((a, b) => getSlotDateTime(a) - getSlotDateTime(b));
        finished.sort((a, b) => getSlotDateTime(b) - getSlotDateTime(a));

        setUpcomingBookings(upcoming);
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
    // Defensive check: ensure booking ID exists
    if (!bookingId || bookingId === 'undefined') {
      setError("Error: Could not identify booking. Please refresh the page and try again.");
      return;
    }

    if (!confirm("Are you sure you want to cancel this booking? You will lose your 10% deposit + ouiimi fee.")) {
      return;
    }

    try {
      const response = await fetch(`/api/bookings/${bookingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          status: "cancelled",
          cancellationReason: "Cancelled by customer",
          cancelledBy: "customer",
        }),
      });

      if (response.ok) {
        router.refresh();
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
      const userId = user?.id || user?._id;

      const [fname, ...lnameParts] = userDetails.name.split(" ");
      const lname = lnameParts.join(" ") || "";

      const response = await fetch(`/api/user/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          fname: fname || user?.fname,
          lname: lname || user?.lname,
          email: userDetails.email || user?.email,
          contactNo: userDetails.number || (user as any)?.contactNo,
        }),
      });

      if (response.ok) {
        router.refresh(); // Refresh session/page data
        setSuccess("Details saved successfully");
        const updatedUser = user ? { ...user, fname, lname, email: userDetails.email, contactNo: userDetails.number } : null;
        if (updatedUser) {
          setUser(updatedUser);
        }
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
      id: booking.id || booking._id,
      name: service?.serviceName || booking.serviceSnapshot?.name || 'Service',
      price: booking.totalCost,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service?.category || booking.serviceSnapshot?.category || '',
      businessName: businessData?.businessName || 'Business',
      location: renderAddress(businessData?.address) || '',
      duration: duration || undefined,
      date: formatDateForDisplay(booking.timeSlot.date),
      time: `${formatTime12Hour(booking.timeSlot.startTime)} - ${formatTime12Hour(booking.timeSlot.endTime)}`,
      bookingId: booking.id || booking._id,
      bookingNumber: booking.bookingNumber,
      status: booking.status,
    };
  };

  const getFilteredBookings = () => {
    let bookingsToFilter: Booking[] = [];

    if (activeTab === "upcoming") {
      bookingsToFilter = upcomingBookings;
    } else if (activeTab === "finished") {
      bookingsToFilter = finishedBookings;
    }

    if (selectedDate) {
      return bookingsToFilter.filter((b) => {
        const bookingDateStr = b.timeSlot.date.split('T')[0];
        return bookingDateStr === selectedDate;
      });
    }
    return bookingsToFilter;
  };

  // Group bookings by service category
  const groupBookingsByCategory = (bookings: Booking[]) => {
    const groups: Record<string, Booking[]> = {};

    bookings.forEach((booking) => {
      const category = typeof booking.serviceId === 'object' && booking.serviceId?.category
        ? booking.serviceId.category
        : (booking.serviceSnapshot?.category || 'Other');

      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(booking);
    });

    // Sort categories alphabetically
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
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
              <ImageUpload
                value={user.pic === "avatar.png" || !user.pic ? "" : user.pic}
                onChange={handleUpdateProfilePic}
                variant="avatar"
              />

              <h2 className="text-xl font-medium text-foreground">
                {user.fname}
              </h2>
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

          {(activeTab === "upcoming" || activeTab === "finished") && (
            <div className="space-y-6">
              {/* Inline Date Picker - Same as Business Dashboard */}
              <InlineDatePicker
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                currentMonth={currentMonth}
                currentYear={currentYear}
                onPrevMonth={() => {
                  if (currentMonth === 0) {
                    setCurrentMonth(11);
                    setCurrentYear(currentYear - 1);
                  } else {
                    setCurrentMonth(currentMonth - 1);
                  }
                  setSelectedDate(null);
                }}
                onNextMonth={() => {
                  if (currentMonth === 11) {
                    setCurrentMonth(0);
                    setCurrentYear(currentYear + 1);
                  } else {
                    setCurrentMonth(currentMonth + 1);
                  }
                  setSelectedDate(null);
                }}
                onGoToCurrentMonth={() => {
                  const now = new Date();
                  setCurrentMonth(now.getMonth());
                  setCurrentYear(now.getFullYear());
                  setSelectedDate(null);
                }}
                getBookingCountForDate={(dateStr) => {
                  const bookings = activeTab === "upcoming" ? upcomingBookings : finishedBookings;
                  return bookings.filter(b => b.timeSlot.date.split('T')[0] === dateStr).length;
                }}
              />

              {isLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : getFilteredBookings().length === 0 ? (
                <div className="text-center py-12 card-polished">
                  <p className="text-muted-foreground">
                    {activeTab === "upcoming" && "No upcoming bookings found."}
                    {activeTab === "finished" && "No finished bookings found."}
                  </p>
                </div>
              ) : isMobile ? (
                // Mobile: Single column with expandable details under each card
                <div className="space-y-3">
                  {groupBookingsByCategory(getFilteredBookings()).map(([category, categoryBookings]) => (
                    <div key={category} className="mb-6">
                      {/* Category Header */}
                      <h3 className="text-lg font-semibold text-[#4A4A4A] mb-3">{category}</h3>
                      <div className="space-y-2">
                        {categoryBookings.map((booking) => {
                          const cardData = formatBookingForServiceCard(booking);
                          const isExpanded = expandedCardId === booking.id;
                          return (
                            <div key={booking.id} className="space-y-3">
                              <div
                                onClick={() => {
                                  if (isExpanded) {
                                    setExpandedCardId(null);
                                  } else {
                                    setExpandedCardId(booking.id);
                                  }
                                }}
                                className="cursor-pointer [&_a]:pointer-events-none"
                              >
                                <ServiceCard {...cardData} />
                              </div>
                              {isExpanded && (
                                <BookingDetailView
                                  booking={booking}
                                  onCancel={() => handleCancelBooking(booking.id)}
                                  onReschedule={() => handleRebook(booking)}
                                  onContact={() => setShowContact(true)}
                                  showContact={showContact}
                                  onCloseContact={() => setShowContact(false)}
                                  isFinished={activeTab === "finished"}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                // Desktop: Two-column grid with side panel
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Booking Cards */}
                  <div className="space-y-4">
                    {groupBookingsByCategory(getFilteredBookings()).map(([category, categoryBookings]) => (
                      <div key={category} className="mb-4">
                        {/* Category Header */}
                        <h3 className="text-lg font-semibold text-[#4A4A4A] mb-3">{category}</h3>
                        <div className="space-y-3">
                          {categoryBookings.map((booking) => {
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
                      </div>
                    ))}
                  </div>

                  {/* Booking Details Modal */}
                  <Modal
                    isOpen={!!selectedBooking}
                    onClose={() => setSelectedBooking(null)}
                    title={typeof selectedBooking?.serviceId === 'object'
                      ? selectedBooking.serviceId.serviceName
                      : (selectedBooking?.serviceSnapshot?.name || 'Booking Details')}
                    maxWidth="max-w-lg"
                  >
                    {selectedBooking && (
                      <BookingDetailView
                        booking={selectedBooking}
                        onCancel={() => handleCancelBooking(selectedBooking.id)}
                        onReschedule={() => handleRebook(selectedBooking)}
                        onContact={() => setShowContact(true)}
                        showContact={showContact}
                        onCloseContact={() => setShowContact(false)}
                        isFinished={activeTab === "finished"}
                      />
                    )}
                  </Modal>
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
  onReschedule,
  onContact,
  showContact,
  onCloseContact,
  isFinished = false,
}: {
  booking: Booking;
  onCancel: () => void;
  onReschedule: () => void;
  onContact: () => void;
  showContact: boolean;
  onCloseContact: () => void;
  isFinished?: boolean;
}) {
  const [showStaffPopup, setShowStaffPopup] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  // Get business ID for linking
  const businessId = typeof booking.businessId === 'object'
    ? booking.businessId._id || booking.businessId.id
    : booking.businessId;

  // Get staff data if available
  const staffData = typeof booking.staffId === 'object' ? booking.staffId : null;

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
            <Link
              href={`/business/${businessId}`}
              className="text-lg font-semibold text-foreground hover:text-primary transition-colors hover:underline"
            >
              {typeof booking.businessId === 'object'
                ? booking.businessId.businessName
                : "Business"}
            </Link>
            <p className="text-sm text-muted-foreground">
              Booking #{booking.bookingNumber || booking.id.slice(-8)}
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
          <p>{typeof booking.serviceId === 'object' ? booking.serviceId.serviceName : (booking.serviceSnapshot?.name || "Service")}</p>
        </div>
        {staffData && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Staff</p>
            <button
              onClick={() => setShowStaffPopup(true)}
              className="text-foreground hover:text-primary transition-colors hover:underline cursor-pointer"
            >
              {staffData.name}
            </button>
          </div>
        )}
        <div>
          <p className="text-sm font-medium text-muted-foreground">Time</p>
          <p>{booking.timeSlot.startTime} - {booking.timeSlot.endTime}</p>
        </div>
        {typeof booking.businessId === 'object' && booking.businessId.address && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Address</p>
            <p>{renderAddress(booking.businessId.address)}</p>
          </div>
        )}
        {typeof booking.serviceId === 'object' && booking.serviceId.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Service Description</p>
            <p className="text-sm text-gray-600">{booking.serviceId.description}</p>
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
        <p className="text-xs text-gray-500 uppercase tracking-wide">Payments</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Deposit:</span>
          <span className="text-green-600">${booking.depositAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">ouiimi fee:</span>
          <span className="text-green-600">${(booking.platformFee || 1.99).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Balance due at venue:</span>
          <span>${booking.remainingAmount.toFixed(2)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {isFinished ? (
          // Finished bookings: Only Re-book button
          <Button
            onClick={onReschedule}
            variant="outline"
            className="w-full"
          >
            Re-book
          </Button>
        ) : (
          // Upcoming bookings: Reschedule, Contact, Cancel
          <>
            <div className="flex gap-3">
              {booking.status === "pending" ? (
                <Button
                  asChild
                  variant="default"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <Link href={`/bookings/${booking.id}/checkout`}>
                    Proceed to Payment
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    onClick={onContact}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
                  >
                    Contact
                  </Button>
                </>
              )}
            </div>
            <Button
              onClick={onCancel}
              variant="outline"
              className="w-full border-red-500 text-red-500 hover:bg-red-50"
            >
              Cancel Booking
            </Button>
          </>
        )}
      </div>

      {showContact && (
        <ContactView
          business={booking.businessId}
          onClose={onCloseContact}
        />
      )}

      {/* Staff Details Popup */}
      {showStaffPopup && staffData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowStaffPopup(false)}
          />
          <div className="relative bg-white rounded-2xl shadow-2xl w-[340px] max-w-[95vw] p-6 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowStaffPopup(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>

            <div className="flex flex-col items-center text-center space-y-4">
              {/* Staff Avatar */}
              {(staffData as any).photo || (staffData as any).avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={(staffData as any).photo || (staffData as any).avatar}
                  alt={staffData.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-[#EECFD1]"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-[#EECFD1]/20 flex items-center justify-center">
                  <span className="text-2xl font-bold text-[#EECFD1]">
                    {staffData.name?.charAt(0) || "S"}
                  </span>
                </div>
              )}

              {/* Staff Name */}
              <h3 className="text-lg font-semibold text-gray-900">{staffData.name}</h3>

              {/* About/Bio */}
              {(staffData as any).about && (
                <div className="w-full text-left">
                  <p className="text-sm font-medium text-muted-foreground mb-1">About</p>
                  <p className="text-sm text-gray-600">{(staffData as any).about}</p>
                </div>
              )}

              {/* Qualifications */}
              {(staffData as any).qualifications && (
                <div className="w-full text-left">
                  <p className="text-sm font-medium text-muted-foreground mb-1">Qualifications</p>
                  <p className="text-sm text-gray-600">{(staffData as any).qualifications}</p>
                </div>
              )}
            </div>
          </div>
        </div>
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
              Booking #{booking.bookingNumber || booking.id.slice(-8)}
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
          <p>{typeof booking.serviceId === 'object' ? booking.serviceId.serviceName : (booking.serviceSnapshot?.name || "Service")}</p>
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
        {typeof booking.serviceId === 'object' && booking.serviceId.description && (
          <div>
            <p className="text-sm font-medium text-muted-foreground">Service Description</p>
            <p className="text-sm text-gray-600">{booking.serviceId.description}</p>
          </div>
        )}
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
        <p className="text-xs text-gray-500 uppercase tracking-wide">Payments</p>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Deposit:</span>
          <span className="text-green-600">${booking.depositAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">ouiimi fee:</span>
          <span className="text-green-600">${(booking.platformFee || 1.99).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Balance due at venue:</span>
          <span>${booking.remainingAmount.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={onRebook}
        variant="outline"
        className="w-full"
      >
        Re-book
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
