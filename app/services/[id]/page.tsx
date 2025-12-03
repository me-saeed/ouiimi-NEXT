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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center text-muted-foreground hover:text-foreground mb-8 transition-colors group"
            >
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-8">
                {/* Service Header Card */}
                <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8">
                  <div className="mb-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                      {service.serviceName}
                    </h1>
                    
                    {service.category && (
                      <div className="flex items-center gap-3 mb-6">
                        <span className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-semibold">
                          {service.category}
                        </span>
                        {service.subCategory && (
                          <span className="px-4 py-1.5 bg-muted text-muted-foreground rounded-full text-sm">
                            {service.subCategory}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-6 text-muted-foreground mb-6">
                      {service.duration && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="font-medium">{service.duration}</span>
                        </div>
                      )}
                      {service.address && (
                        <div className="flex items-center gap-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="font-medium">{service.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="text-4xl font-bold text-foreground">
                      ${service.baseCost?.toFixed(2) || "0.00"}
                    </div>
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Description</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Add-ons */}
                {service.addOns && service.addOns.length > 0 && (
                  <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-8">
                    <h2 className="text-2xl font-bold text-foreground mb-6">Add-ons</h2>
                    <div className="space-y-3">
                      {service.addOns.map((addOn: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-3 px-4 bg-muted/50 rounded-xl border border-border/50">
                          <span className="text-foreground font-medium">{addOn.name}</span>
                          <span className="font-bold text-foreground">+${addOn.cost?.toFixed(2) || "0.00"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - Booking Card */}
              <div className="lg:col-span-1">
                <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-6 sticky top-24">
                  {/* Business Info */}
                  {business && (
                    <div className="mb-6 pb-6 border-b border-border/50">
                      <h3 className="text-lg font-bold text-foreground mb-4">Business</h3>
                      <div className="flex items-start gap-3">
                        {business.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={business.logo}
                            alt={business.businessName}
                            className="w-14 h-14 rounded-xl object-cover border border-border/50"
                          />
                        )}
                        <div className="flex-1">
                          <Link
                            href={`/business/${business._id || business.id}`}
                            className="font-bold text-foreground hover:text-primary transition-colors block"
                          >
                            {business.businessName}
                          </Link>
                          {business.address && (
                            <p className="text-sm text-muted-foreground mt-1.5">
                              {business.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-6 pb-6 border-b border-border/50">
                    <div className="flex justify-between items-baseline">
                      <span className="text-muted-foreground font-medium">Base Price</span>
                      <span className="text-3xl font-bold text-foreground">
                        ${service.baseCost?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Booking Form */}
                  <BookingForm service={service} business={business} />

                  {/* Status */}
                  {service.status && (
                    <div className="mt-6 text-center">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        service.status === 'listed'
                          ? 'bg-primary/10 text-primary'
                          : service.status === 'booked'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {service.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50/50">
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Select Date <span className="text-destructive">*</span>
          </label>
          <select
            value={selectedDate}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedTimeSlot(null);
              setSelectedStaff("");
            }}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">Choose a date</option>
            {availableDates.map((date: string) => {
              const dateObj = new Date(date);
              return (
                <option key={date} value={date}>
                  {dateObj.toLocaleDateString("en-US", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
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
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Select Time <span className="text-destructive">*</span>
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
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Choose a time</option>
              {availableTimeSlots.map((slot: any, idx: number) => (
                <option
                  key={idx}
                  value={`${slot.startTime}-${slot.endTime}`}
                >
                  {slot.startTime} - {slot.endTime}
                </option>
              ))}
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
            <label className="text-sm font-semibold text-foreground mb-2 block">
              Preferred Staff <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            >
              <option value="">Any available staff</option>
              {availableStaff.map((staff: any) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Service Address
          </label>
          <input
            type="text"
            value={service.address || (typeof service.businessId === 'object' ? service.businessId.address : business?.address) || ""}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-border bg-muted/50 text-muted-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground mb-2 block">
            Special Requests <span className="text-muted-foreground text-xs">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Any special requests or notes for the service provider..."
            rows={4}
            className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
          />
        </div>

        {/* Add-ons */}
        {service.addOns && service.addOns.length > 0 && (
          <div className="space-y-3 pt-4 border-t border-border/50">
            <label className="text-sm font-semibold text-foreground block">
              Add-Ons <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
            </label>
            <div className="space-y-2.5">
              {service.addOns.map((addon: any, idx: number) => (
                <label 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-xl border border-border/50 hover:bg-muted/30 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedAddOns.some((a) => a.name === addon.name)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAddOns([...selectedAddOns, addon]);
                        } else {
                          setSelectedAddOns(selectedAddOns.filter((a) => a.name !== addon.name));
                        }
                      }}
                      className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                    />
                    <span className="text-sm font-medium text-foreground">{addon.name}</span>
                  </div>
                  <span className="text-sm font-semibold text-foreground">+${addon.cost.toFixed(2)}</span>
                </label>
              ))}
            </div>
          </div>
        )}

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

