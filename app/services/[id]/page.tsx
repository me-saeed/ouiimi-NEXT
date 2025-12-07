"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ServiceDetailContent() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.id as string;
  
  const [user, setUser] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }

    const loadServiceData = async () => {
      try {
        const response = await fetch(`/api/services/${serviceId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            setError("Service not found");
          } else {
            setError("Failed to load service details");
          }
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        if (data.service) {
          setService(data.service);
          
          // Fetch business details if businessId is populated
          if (data.service.businessId) {
            if (typeof data.service.businessId === 'object' && data.service.businessId.businessName) {
              // Already populated
              setBusiness(data.service.businessId);
            } else {
              // Fetch business separately if not populated
              const businessId = typeof data.service.businessId === 'object' 
                ? data.service.businessId._id || data.service.businessId.id
                : data.service.businessId;
              
              if (businessId) {
                const businessResponse = await fetch(`/api/business/${businessId}`);
                if (businessResponse.ok) {
                  const businessData = await businessResponse.json();
                  setBusiness(businessData.business);
                }
              }
            }
          }
        } else {
          setError("Service not found");
        }
      } catch (err: any) {
        console.error("Error loading service:", err);
        setError("Failed to load service details");
      } finally {
        setIsLoading(false);
      }
    };

    if (serviceId) {
      loadServiceData();
    }
  }, [serviceId]);

  if (isLoading) {
    return (
      <PageLayout user={user || null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !service) {
    return (
      <PageLayout user={user || null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">
                Service Not Found
              </h1>
              <p className="text-[#3A3A3A]/70 mb-8">{error || "The service you're looking for doesn't exist."}</p>
              <Link
                href="/services"
                className="btn-polished btn-polished-primary inline-block"
              >
                Browse Services
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user || null}>
      <div className="bg-white min-h-screen py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          {/* Booking Card - Modern Professional Design */}
          <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            {/* Booking Form */}
            <div className="p-8">
              <BookingForm service={service} business={business} user={user || null} />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Booking Form Component
function BookingForm({ service, business, user }: { service: any; business: any; user: any }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; cost: number }>>([]);
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [staffBusyStatus, setStaffBusyStatus] = useState<Record<string, boolean>>({});

  // Convert 24-hour time to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  // Fix date logic - properly filter and sort dates
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const availableDates: string[] = service.timeSlots && Array.isArray(service.timeSlots) && service.timeSlots.length > 0
    ? (() => {
        const dateStrings: string[] = service.timeSlots
          .filter((slot: any) => {
            if (!slot || slot.isBooked) return false;
            try {
              const slotDate = new Date(slot.date);
              if (isNaN(slotDate.getTime())) return false;
              slotDate.setHours(0, 0, 0, 0);
              return slotDate >= today;
            } catch (e) {
              console.error("Error filtering slot:", e, slot);
              return false;
            }
          })
          .map((slot: any) => {
            try {
              const date = new Date(slot.date);
              if (isNaN(date.getTime())) return null;
              return date.toISOString().split('T')[0];
            } catch (e) {
              console.error("Error mapping slot date:", e, slot);
              return null;
            }
          })
          .filter((date: string | null): date is string => date !== null);
        return [...new Set(dateStrings)].sort((a: string, b: string) => 
          new Date(a).getTime() - new Date(b).getTime()
        );
      })()
    : [];

  const availableTimeSlots = selectedDate
    ? (service.timeSlots || []).filter((slot: any) => {
        if (!slot || slot.isBooked) return false;
        try {
          const slotDate = new Date(slot.date);
          if (isNaN(slotDate.getTime())) return false;
          const slotDateStr = slotDate.toISOString().split('T')[0];
          return slotDateStr === selectedDate;
        } catch (e) {
          console.error("Error parsing slot date:", e, slot);
          return false;
        }
      })
    : [];

  const availableStaff = selectedTimeSlot
    ? (selectedTimeSlot.staffIds || []).map((staff: any) => ({
        id: typeof staff === 'object' ? staff._id || staff.id : staff,
        name: typeof staff === 'object' ? staff.name : "Staff",
      }))
    : [];

  // Check staff busy status when date and time slot are selected
  useEffect(() => {
    const checkStaffAvailability = async () => {
      if (!selectedDate || !selectedTimeSlot) {
        setStaffBusyStatus({});
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const busyStatus: Record<string, boolean> = {};
        
        // Check each staff member's availability
        await Promise.all(
          availableStaff.map(async (staff: any) => {
            try {
              const response = await fetch(
                `/api/bookings?staffId=${staff.id}&date=${selectedDate}&status=confirmed,pending`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );
              
              if (response.ok) {
                const data = await response.json();
                const bookings = data.bookings || [];
                
                // Check if staff is busy at this time
                const isBusy = bookings.some((booking: any) => {
                  const bookingStart = booking.timeSlot.startTime;
                  const bookingEnd = booking.timeSlot.endTime;
                  const slotStart = selectedTimeSlot.startTime;
                  const slotEnd = selectedTimeSlot.endTime;
                  
                  // Check for time overlap
                  return (
                    (slotStart >= bookingStart && slotStart < bookingEnd) ||
                    (slotEnd > bookingStart && slotEnd <= bookingEnd) ||
                    (slotStart <= bookingStart && slotEnd >= bookingEnd)
                  );
                });
                
                busyStatus[staff.id] = isBusy;
              }
            } catch (err) {
              console.error(`Error checking availability for staff ${staff.id}:`, err);
            }
          })
        );
        
        setStaffBusyStatus(busyStatus);
      } catch (err) {
        console.error("Error checking staff availability:", err);
      }
    };

    checkStaffAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedTimeSlot]);

  const calculateTotal = () => {
    const baseCost = service.baseCost || 0;
    const addOnsCost = selectedAddOns.reduce((sum, addon) => sum + addon.cost, 0);
    return baseCost + addOnsCost;
  };

  const handleAddToCart = () => {
    if (!selectedDate || !selectedTimeSlot) {
      setError("Please select a date and time slot");
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
      baseCost: service.baseCost,
      addOns: selectedAddOns,
      totalCost: calculateTotal(),
      address: service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address),
      description: description,
    };

    // Get existing cart
    const existingCart = localStorage.getItem("cart");
    const cart = existingCart ? JSON.parse(existingCart) : [];

    // Check if item from same business
    if (cart.length > 0) {
      const firstItem = cart[0];
      if (firstItem.businessId !== cartItem.businessId) {
        setError("You can only add services from one business at a time. Please checkout your current cart first.");
        return;
      }
    }

    // Add to cart
    cart.push(cartItem);
    localStorage.setItem("cart", JSON.stringify(cart));

    // Redirect to cart
    router.push("/cart");
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-6">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Business Owner Name and Logo Header - Clickable */}
      {(business?.businessName || business?.logo || user?.fname) && (
        <div className="pb-4 border-b border-gray-200">
          <Link 
            href={business?._id || business?.id ? `/business/${business._id || business.id}` : '#'}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer group"
          >
            {business?.logo ? (
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-gray-200 group-hover:border-[#EECFD1] transition-colors flex-shrink-0">
                <Image
                  src={business.logo}
                  alt={business.businessName || "Business Logo"}
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 group-hover:bg-[#EECFD1]/20 transition-colors flex items-center justify-center flex-shrink-0">
                <span className="text-lg font-bold text-gray-500 group-hover:text-[#EECFD1]">
                  {(business?.businessName || user?.fname || 'B').charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold text-[#3A3A3A] group-hover:text-[#EECFD1] transition-colors">
                {business?.businessName || `${user?.fname || ''} ${user?.lname || ''}`.trim() || 'Booking'}
              </h2>
              {business?.businessName && (
                <p className="text-xs text-gray-500 mt-0.5">Click to view business profile</p>
              )}
            </div>
          </Link>
        </div>
      )}

      <div className="space-y-6">
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
              className="w-full px-4 py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300"
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
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
              className="w-full px-4 py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{selectedDate && availableTimeSlots.length > 0 ? "Select Preferred Time" : selectedDate ? "No time slots available" : "Select Date First"}</option>
              {availableTimeSlots.map((slot: any, idx: number) => {
                // Calculate duration
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
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          </div>

          <div className="space-y-2">
          <label className="text-sm font-semibold text-gray-700 mb-2 block">
            Staff
            </label>
          <div className="relative">
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              disabled={!selectedTimeSlot || availableStaff.length === 0}
              className="w-full px-4 py-3.5 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="">{selectedTimeSlot && availableStaff.length > 0 ? "Select Preferred Staff" : selectedTimeSlot ? "No staff available" : "Select Time First"}</option>
              {availableStaff.map((staff: any) => {
                const isBusy = staffBusyStatus[staff.id] || false;
                return (
                  <option key={staff.id} value={staff.id} disabled={isBusy}>
                    {staff.name} {isBusy ? "Busy" : ""}
                  </option>
                );
              })}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
            <p className="text-base font-bold text-[#3A3A3A]">{service.serviceName || ""}</p>
        </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
              ADDRESS
          </label>
            <p className="text-sm text-[#3A3A3A]">
              {service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address) || ""}
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

        {/* Add-ons */}
        {service.addOns && service.addOns.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 mb-2 block">
              Add-Ons
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  const addon = service.addOns.find((a: any) => a.name === e.target.value);
                  if (addon && !selectedAddOns.some((a) => a.name === addon.name)) {
                    setSelectedAddOns([...selectedAddOns, { name: addon.name, cost: addon.cost || 0 }]);
                  }
                  e.target.value = "";
                }
              }}
              className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-4 pr-10 hover:border-gray-300"
            >
              <option value="">Select Add-Ons</option>
              {service.addOns.map((addon: any, idx: number) => (
                <option key={idx} value={addon.name}>
                  {addon.name} - ${addon.cost?.toFixed(2) || "0.00"}
                </option>
              ))}
            </select>
            {selectedAddOns.length > 0 && (
              <div className="mt-3 space-y-2 pl-1">
                {selectedAddOns.map((addon, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm bg-white rounded-lg px-4 py-2.5 border border-gray-100">
                    <span className="text-gray-700">{addon.name}</span>
                    <span className="font-semibold text-gray-900">${addon.cost.toFixed(2)}</span>
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
              <span className="font-medium text-[#3A3A3A]">${service.baseCost?.toFixed(2) || "0.00"}</span>
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
              <span className="text-2xl font-bold text-[#3A3A3A]">${calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Book Now Button */}
        <Button
          onClick={handleAddToCart}
          disabled={isLoading || !selectedDate || !selectedTimeSlot || availableDates.length === 0}
          size="lg"
          className="w-full h-14 rounded-xl bg-[#EECFD1] hover:bg-[#EECFD1]/90 text-[#3A3A3A] font-semibold text-base shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#3A3A3A] border-t-transparent mr-2" />
              Processing...
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
          10% Deposit + $1.99 ouiimi fee paid today, 90% paid directly to Business
        </p>
      </div>
    </div>
  );
}

export default function ServiceDetailPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    }>
      <ServiceDetailContent />
    </Suspense>
  );
}

