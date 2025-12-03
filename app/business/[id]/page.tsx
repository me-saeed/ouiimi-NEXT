"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";

function BusinessProfileContent() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"story" | "services" | "staff">("services");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null);
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

    loadBusinessData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  const loadBusinessData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [businessRes, servicesRes, staffRes] = await Promise.all([
        fetch(`/api/business/${businessId}`),
        fetch(`/api/services?businessId=${businessId}&status=listed`),
        fetch(`/api/staff?businessId=${businessId}`),
      ]);

      if (businessRes.ok) {
        const businessData = await businessRes.json();
        setBusiness(businessData.business);
      } else {
        setError("Business not found");
      }

      if (servicesRes.ok) {
        const servicesData = await servicesRes.json();
        setServices(servicesData.services || []);
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaff(staffData.staff || []);
      }
    } catch (e) {
      console.error("Error loading business data:", e);
      setError("Failed to load business information");
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredServices = () => {
    let filtered = services;

    if (selectedDate) {
      filtered = filtered.filter((service) => {
        return service.timeSlots?.some((slot: any) => {
          const slotDate = new Date(slot.date);
          return slotDate.toDateString() === selectedDate.toDateString();
        });
      });
    }

    return filtered;
  };

  const groupServicesBySubCategory = (services: any[]) => {
    const grouped: Record<string, any[]> = {};
    services.forEach((service) => {
      const key = service.subCategory || service.category || "Other";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(service);
    });
    return grouped;
  };

  const getNextAvailableTimeSlot = (service: any) => {
    if (!service.timeSlots || service.timeSlots.length === 0) {
      return { date: null, time: null };
    }

    const now = new Date();
    const availableSlots = service.timeSlots
      .filter((slot: any) => {
        const slotDate = new Date(slot.date);
        return slotDate >= now;
      })
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (availableSlots.length === 0) {
      return { date: null, time: null };
    }

    const nextSlot = availableSlots[0];
    const date = new Date(nextSlot.date);
    const formattedDate = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    });
    const time = `${nextSlot.startTime} - ${nextSlot.endTime}`;

    return { date: formattedDate, time };
  };

  const formatServiceForCard = (service: any) => {
    const { date, time } = getNextAvailableTimeSlot(service);
    const serviceBusiness = typeof service.businessId === 'object' ? service.businessId : business;
    
    return {
      id: service.id,
      name: service.serviceName,
      price: service.baseCost,
      image: business?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: serviceBusiness?.businessName || "Business",
      location: serviceBusiness?.address || "",
      duration: service.duration,
      date: date,
      time: time,
    };
  };

  if (isLoading) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    );
  }

  if (error || !business) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Business Not Found</h2>
              <p className="text-muted-foreground mb-6">{error || "The business you're looking for doesn't exist."}</p>
              <Button onClick={() => router.push("/")} className="btn-polished-primary">
                Go Home
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const filteredServices = getFilteredServices();
  const groupedServices = groupServicesBySubCategory(filteredServices);

  return (
    <PageLayout user={user}>
      <div className="bg-background min-h-screen">
        {/* Business Header */}
        <div className="bg-secondary/30 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-4xl font-serif italic text-secondary-foreground">ouiimi</h1>
              
              {business.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {business.businessName?.charAt(0) || "B"}
                  </span>
                </div>
              )}

              <h2 className="text-xl font-medium text-foreground">{business.businessName}</h2>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b border-border/50 sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center w-full max-w-3xl mx-auto">
              <button
                onClick={() => setActiveTab("story")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === "story"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Story
                {activeTab === "story" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("services")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === "services"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Services
                {activeTab === "services" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${
                  activeTab === "staff"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Staff
                {activeTab === "staff" && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "story" && (
            <div className="max-w-3xl mx-auto">
              <div className="card-polished p-8">
                <h2 className="text-2xl font-semibold mb-4">Our Story</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {business.story || "No story available yet."}
                </p>
                <div className="mt-6 space-y-2 text-sm">
                  <p><span className="font-medium">Address:</span> {business.address}</p>
                  {business.email && (
                    <p><span className="font-medium">Email:</span> {business.email}</p>
                  )}
                  {business.phone && (
                    <p><span className="font-medium">Phone:</span> {business.phone}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === "services" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Services</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setSelectedDate(e.target.value ? new Date(e.target.value) : null)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  />
                  {selectedDate && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDate(null)}
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>

              {filteredServices.length === 0 ? (
                <div className="text-center py-12 card-polished">
                  <p className="text-muted-foreground">
                    {selectedDate ? "No services available on this date." : "No services listed yet."}
                  </p>
                </div>
              ) : (
                Object.entries(groupedServices).map(([subCategory, categoryServices]) => (
                  <div key={subCategory} className="space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">{subCategory}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-6">
                      {categoryServices.map((service) => (
                        <ServiceCard
                          key={service.id}
                          {...formatServiceForCard(service)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === "staff" && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Our Staff</h2>
              {staff.length === 0 ? (
                <div className="text-center py-12 card-polished">
                  <p className="text-muted-foreground">No staff members listed yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                  {staff.map((member) => (
                    <div
                      key={member.id}
                      onClick={() => setSelectedStaff(member)}
                      className="card-polished p-6 text-center cursor-pointer hover:shadow-md transition-shadow"
                    >
                      {member.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-primary">
                            {member.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <h3 className="font-semibold">{member.name}</h3>
                      {member.bio && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {member.bio}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {selectedStaff && (
                <StaffModal
                  staff={selectedStaff}
                  onClose={() => setSelectedStaff(null)}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

// Staff Modal Component
function StaffModal({ staff, onClose }: { staff: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-2xl"
        >
          ×
        </button>
        <div className="text-center space-y-4">
          {staff.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={staff.photo}
              alt={staff.name}
              className="w-32 h-32 rounded-full object-cover mx-auto"
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <span className="text-4xl font-bold text-primary">
                {staff.name.charAt(0)}
              </span>
            </div>
          )}
          <h3 className="text-2xl font-semibold">{staff.name}</h3>
          {staff.bio && (
            <p className="text-muted-foreground">{staff.bio}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BusinessProfilePage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    }>
      <BusinessProfileContent />
    </Suspense>
  );
}

