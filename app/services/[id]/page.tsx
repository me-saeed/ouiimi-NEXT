"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
          {/* Booking Card - Mobile First Design */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6 md:p-8">
            {/* Business Header */}
            {business && (
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-200">
                {business.logo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo}
                    alt={business.businessName}
                    className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                  />
                )}
                <div className="flex-1">
                  <Link
                    href={`/business/${business._id || business.id}`}
                    className="text-lg font-bold text-[#3A3A3A] hover:text-[#EECFD1] transition-colors block"
                  >
                    {business.businessName}
                  </Link>
                </div>
              </div>
            )}

            {/* Booking Form */}
            <BookingForm service={service} business={business} />
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Booking Form Component
function BookingForm({ service, business }: { service: any; business: any }) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; cost: number }>>([]);
  const [description, setDescription] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [staffBusyStatus, setStaffBusyStatus] = useState<Record<string, boolean>>({});

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
      time: `${selectedTimeSlot.startTime} - ${selectedTimeSlot.endTime}`,
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
    <div className="space-y-5">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            Date:
          </label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTimeSlot(null);
              setSelectedStaff("");
            }}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-3 pr-10"
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

        {selectedDate && availableTimeSlots.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
              Time:
            </label>
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-3 pr-10"
            >
              <option value="">Select Preferred Time</option>
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
                    {slot.startTime} - {slot.endTime} {duration}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {selectedDate && availableTimeSlots.length === 0 && (
          <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
            <p className="text-sm text-muted-foreground text-center">
              No available time slots for this date
            </p>
          </div>
        )}

        {availableStaff.length > 0 && selectedTimeSlot && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
              Staff:
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-3 pr-10"
            >
              <option value="">Select Preferred Staff</option>
              {availableStaff.map((staff: any) => {
                const isBusy = staffBusyStatus[staff.id] || false;
                return (
                  <option key={staff.id} value={staff.id} disabled={isBusy}>
                    {staff.name} {isBusy ? "Busy" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            Service:
          </label>
          <input
            type="text"
            value={service.serviceName || ""}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#3A3A3A] text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            Address:
          </label>
          <input
            type="text"
            value={service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address) || ""}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#3A3A3A] text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            Description:
          </label>
          <textarea
            value={service.description || ""}
            disabled
            rows={4}
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#3A3A3A] text-sm resize-none"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            cost:
          </label>
          <input
            type="text"
            value={`$${service.baseCost?.toFixed(2) || "0.00"}`}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#3A3A3A] text-sm font-semibold"
          />
        </div>

        {/* Add-ons */}
        {service.addOns && service.addOns.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
              Add-Ons:
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
              className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-white text-[#3A3A3A] text-sm focus:outline-none focus:ring-1 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTIiIGhlaWdodD0iOCIgdmlld0JveD0iMCAwIDEyIDgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMUw2IDZMMTEgMSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==')] bg-no-repeat bg-right-3 pr-10"
            >
              <option value="">Add-Ons</option>
              {service.addOns.map((addon: any, idx: number) => (
                <option key={idx} value={addon.name}>
                  {addon.name} ${addon.cost?.toFixed(2) || "0.00"}
                </option>
              ))}
            </select>
            {selectedAddOns.length > 0 && (
              <div className="mt-2 space-y-1.5 pl-2">
                {selectedAddOns.map((addon, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm text-[#3A3A3A]">
                    <span>{addon.name}</span>
                    <span className="font-semibold">${addon.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <label className="text-sm font-semibold text-[#3A3A3A] mb-1.5 block">
            Total Cost:
          </label>
          <input
            type="text"
            value={`= cost + add-ons`}
            disabled
            className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-[#3A3A3A] text-sm"
          />
          <div className="text-right mt-2">
            <span className="text-xl font-bold text-[#3A3A3A]">
              ${calculateTotal().toFixed(2)}
            </span>
          </div>
        </div>

        <button
          onClick={handleAddToCart}
          disabled={!selectedDate || !selectedTimeSlot || isLoading}
          className="w-full bg-[#EECFD1] text-[#3A3A3A] hover:bg-[#EECFD1]/90 rounded-lg py-3.5 text-base font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
        >
          {isLoading ? "Processing..." : "Book Now"}
        </button>

        {/* Pricing Summary */}
        <div className="pt-4 border-t border-border/50 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Base Cost</span>
            <span className="font-medium text-foreground">${service.baseCost?.toFixed(2) || "0.00"}</span>
          </div>
          {selectedAddOns.length > 0 && (
            <div className="space-y-1.5">
              {selectedAddOns.map((addon, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{addon.name}</span>
                  <span className="font-medium text-foreground">+${addon.cost.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="flex justify-between items-center pt-3 border-t border-border/50">
            <span className="font-bold text-foreground">Total</span>
            <span className="text-2xl font-bold text-foreground">${calculateTotal().toFixed(2)}</span>
          </div>
        </div>

        <Button
          onClick={handleAddToCart}
          disabled={isLoading || !selectedDate || !selectedTimeSlot || availableDates.length === 0}
          size="lg"
          className="w-full h-12 rounded-xl btn-polished-primary shadow-lg hover:shadow-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Adding to Cart...
            </>
          ) : availableDates.length === 0 ? (
            "No Available Dates"
          ) : !selectedDate ? (
            "Select Date First"
          ) : !selectedTimeSlot ? (
            "Select Time First"
          ) : (
            "Add to Cart"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center leading-relaxed">
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

