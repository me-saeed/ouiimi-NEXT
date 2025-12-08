"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceCarousel } from "@/components/ui/service-carousel";
import { ArrowRight, X } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Dog Grooming",
];

// Removed: Categories are now shown without subcategory grouping

interface Service {
  id: string;
  serviceName: string;
  category: string;
  subCategory?: string;
  businessId: any;
  timeSlots?: Array<{
    date: string | Date;
    startTime: string;
    endTime: string;
    price: number;
    duration: number;
    isBooked?: boolean;
  }>;
}

export default function HomePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Record<string, Service[]>>({});
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [sidePanelOpen, setSidePanelOpen] = useState(false);
  const [sidePanelCategory, setSidePanelCategory] = useState<string>("");
  const [sidePanelServices, setSidePanelServices] = useState<Service[]>([]);
  const [expandedSubcategories, setExpandedSubcategories] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadServices();
    // Set up interval to refresh services every 30 seconds for real-time updates
    const interval = setInterval(() => {
      loadServices();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadServices = async () => {
    try {
      const servicesData: Record<string, Service[]> = {};
      const countsData: Record<string, number> = {};

      // Fetch services for each category
      await Promise.all(
        SERVICE_CATEGORIES.map(async (category) => {
          try {
            // Fetch first 6 services for display
            const response = await fetch(
              `/api/services?category=${encodeURIComponent(category)}&status=listed&limit=6`
            );
            if (response.ok) {
              const data = await response.json();
              // Filter out services with no available slots (check if earliest slot exists)
              const servicesWithSlots = (data.services || []).filter((service: Service) => {
                const earliestSlot = getEarliestAvailableTimeSlot(service);
                return earliestSlot !== null;
              });
              servicesData[category] = servicesWithSlots;
              // Get total count from pagination (but only count services with available slots)
              countsData[category] = servicesWithSlots.length;
            } else {
              servicesData[category] = [];
              countsData[category] = 0;
            }
          } catch (error) {
            console.error(`Error loading services for ${category}:`, error);
            servicesData[category] = [];
            countsData[category] = 0;
          }
        })
      );

      setServices(servicesData);
      setServiceCounts(countsData);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time to 12-hour AM/PM format
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period.toLowerCase()}`;
  };

  const getEarliestAvailableTimeSlot = (service: Service) => {
    if (!service.timeSlots || service.timeSlots.length === 0) {
      return null;
    }

    const now = new Date();
    
    // Find all available (not booked) future slots
    const availableSlots = service.timeSlots
      .filter((slot) => {
        if (slot.isBooked) return false;
        
        const slotDate = typeof slot.date === 'string' ? new Date(slot.date) : new Date(slot.date);
        const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        // If slot date is today, check if end time has passed
        if (slotDateOnly.getTime() === nowDateOnly.getTime()) {
          const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
          const slotEndDateTime = new Date(slotDate);
          slotEndDateTime.setHours(endHours, endMinutes, 0, 0);
          return slotEndDateTime > now;
        }
        
        // If slot date is in the future
        return slotDateOnly > nowDateOnly;
      })
      .sort((a, b) => {
        const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date);
        const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date);
        
        // Sort by date first
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        // If same date, sort by start time
        const [hoursA, minsA] = a.startTime.split(":").map(Number);
        const [hoursB, minsB] = b.startTime.split(":").map(Number);
        const timeA = hoursA * 60 + minsA;
        const timeB = hoursB * 60 + minsB;
        return timeA - timeB;
      });

    if (availableSlots.length === 0) {
      return null;
    }

    const earliestSlot = availableSlots[0];
    const slotDate = typeof earliestSlot.date === 'string' ? new Date(earliestSlot.date) : new Date(earliestSlot.date);
    
    // Format date as DD.MM.YY (06.06.26)
    const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;
    
    // Format time as "10:00 am - 12:00pm"
    const formattedTime = `${formatTime12Hour(earliestSlot.startTime)} - ${formatTime12Hour(earliestSlot.endTime)}`;

    return { 
      date: formattedDate, 
      time: formattedTime,
      price: earliestSlot.price 
    };
  };

  const handleShowMore = async (category: string) => {
    setSidePanelCategory(category);
    setSidePanelOpen(true);
    setExpandedSubcategories({});
    
    // Fetch all services for this category
    try {
      const response = await fetch(
        `/api/services?category=${encodeURIComponent(category)}&status=listed`
      );
      if (response.ok) {
        const data = await response.json();
        const servicesWithSlots = (data.services || []).filter((service: Service) => {
          const earliestSlot = getEarliestAvailableTimeSlot(service);
          return earliestSlot !== null;
        });
        setSidePanelServices(servicesWithSlots);
      }
    } catch (error) {
      console.error(`Error loading services for ${category}:`, error);
      setSidePanelServices([]);
    }
  };

  const handleExpandSubcategory = (subcategory: string) => {
    setExpandedSubcategories(prev => ({
      ...prev,
      [subcategory]: !prev[subcategory]
    }));
  };

  // const groupServicesBySubcategory = (services: Service[]) => {
  //   const grouped: Record<string, Service[]> = {};
  //   services.forEach(service => {
  //     const subcategory = service.subCategory || "Other";
  //     if (!grouped[subcategory]) {
  //       grouped[subcategory] = [];
  //     }
  //     grouped[subcategory].push(service);
  //   });
  //   return grouped;
  // };

  // Group services by subcategory for specific categories
  const groupServicesBySubcategory = (services: Service[]) => {
    const grouped: Record<string, Service[]> = {};
    services.forEach((service) => {
      const subCategory = service.subCategory || "Other";
      if (!grouped[subCategory]) {
        grouped[subCategory] = [];
      }
      grouped[subCategory].push(service);
    });
    return grouped;
  };

  const shouldGroupBySubcategory = (category: string) => {
    return category === "Hair Services" || category === "Dog Grooming";
  };

  const formatServiceForCard = (service: Service) => {
    const earliestSlot = getEarliestAvailableTimeSlot(service);
    const business = typeof service.businessId === 'object' ? service.businessId : null;

    // Calculate duration from earliest slot if available
    let duration = "";
    if (earliestSlot && service.timeSlots && service.timeSlots.length > 0) {
      const slot = service.timeSlots.find(s => {
        const slotDate = typeof s.date === 'string' ? new Date(s.date) : new Date(s.date);
        const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;
        return formattedDate === earliestSlot.date;
      });
      if (slot && slot.duration) {
        const hours = Math.floor(slot.duration / 60);
        const mins = slot.duration % 60;
        if (hours > 0 && mins > 0) {
          duration = `${hours}Hr ${mins}mins`;
        } else if (hours > 0) {
          duration = `${hours}Hr`;
        } else {
          duration = `${mins}mins`;
        }
      }
    }

    return {
      id: service.id,
      name: service.serviceName,
      price: earliestSlot?.price ?? 0,
      image: business?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: business?.businessName || "Business",
      location: business?.address || "",
      duration: duration,
      date: earliestSlot?.date || null,
      time: earliestSlot?.time || null,
    };
  };

// Removed: No longer grouping by subcategory

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen">
        {/* Book Button - Below Nav */}
        <div className="bg-white py-3 sm:py-4">
          <div className="container mx-auto px-4 max-w-7xl">
            <div className="flex justify-center">
              <Button
                variant="pink"
                asChild
                className="h-10 px-6 text-sm font-normal rounded-lg bg-[#EECFD1] text-[#3A3A3A] hover:bg-[#EECFD1]/90 shadow-none hover:shadow-none active:scale-100"
              >
                <Link href="/services">Book</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <section className="py-4 md:py-8 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-[#3A3A3A] mb-4 sm:mb-5 md:mb-6 text-left">
              Discover
            </h1>

            {/* Service Categories */}
            <div className="space-y-8 sm:space-y-10 md:space-y-12">
              {SERVICE_CATEGORIES.map((category, categoryIndex) => {
                const categoryServices = services[category] || [];

                if (isLoading) {
                  return (
                    <div key={category} className="mb-0">
                      <div className="flex items-center justify-between mb-5 md:mb-6 px-4 md:px-0">
                        <h2 className="text-2xl md:text-3xl font-bold text-[#3A3A3A]">{category}</h2>
                      </div>
                      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pl-4 pr-4 sm:pl-6 sm:pr-6 lg:pl-8 lg:pr-8 md:pl-6 md:pr-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div
                            key={i}
                            className="bg-white border border-[#E5E5E5] rounded-[12px] w-[320px] sm:w-[320px] md:w-[340px] lg:w-[360px] h-[100px] flex-shrink-0 animate-pulse overflow-hidden"
                          >
                            <div className="p-4 flex gap-4 h-full">
                              {/* Logo skeleton */}
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex-shrink-0" />
                              {/* Content skeleton */}
                              <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                                <div className="h-3 bg-gray-200 rounded w-full" />
                                <div className="h-3 bg-gray-200 rounded w-2/3" />
                              </div>
                            </div>
                          </div>
                        ))}
                        {/* Spacer to show peek of next card on mobile */}
                        <div className="flex-shrink-0 w-4 md:w-0" />
                      </div>
                    </div>
                  );
                }

                if (categoryServices.length === 0) {
                  return null;
                }

                // Display all services under the main category (no subcategory grouping)
                return (
                  <ServiceCarousel
                    key={category}
                    title={category}
                    totalCount={serviceCounts[category] || 0}
                    showMoreHref={`/services?category=${encodeURIComponent(category)}`}
                    onShowMore={handleShowMore}
                    category={category}
                  >
                    {categoryServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        {...formatServiceForCard(service)}
                      />
                    ))}
                  </ServiceCarousel>
                );
              })}
            </div>
          </div>
        </section>

        {/* Side Panel for See More */}
        {sidePanelOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <div 
              className="flex-1 bg-black/50 backdrop-blur-sm"
              onClick={() => setSidePanelOpen(false)}
            />
            {/* Side Panel */}
            <div className="w-full sm:w-[400px] md:w-[500px] bg-white shadow-2xl overflow-y-auto" style={{ animation: 'slideInRight 0.3s ease-out' }}>
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between z-10">
                <h2 className="text-xl font-bold text-[#3A3A3A]">{sidePanelCategory}</h2>
                <button
                  onClick={() => setSidePanelOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5 text-[#3A3A3A]" />
                </button>
              </div>
              <div className="p-4">
                {sidePanelServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No services available</p>
                  </div>
                ) : (sidePanelCategory === "Hair Services" || sidePanelCategory === "Dog Grooming") ? (
                  // Group by subcategory for Hair Services and Dog Grooming
                  (() => {
                    const grouped = groupServicesBySubcategory(sidePanelServices);
                    const subcategories = Object.keys(grouped).sort();
                    
                    return (
                      <div className="space-y-6">
                        {subcategories.map((subcategory) => {
                          const subcategoryServices = grouped[subcategory];
                          const isExpanded = expandedSubcategories[subcategory];
                          const displayServices = isExpanded ? subcategoryServices : subcategoryServices.slice(0, 6);
                          const hasMore = subcategoryServices.length > 6;
                          
                          return (
                            <div key={subcategory} className="space-y-3">
                              {/* Subcategory Heading */}
                              <h3 className="text-lg font-bold text-[#3A3A3A]">{subcategory}</h3>
                              
                              {/* Services for this subcategory */}
                              <div className="space-y-3">
                                {displayServices.map((service) => (
                                  <ServiceCard
                                    key={service.id}
                                    {...formatServiceForCard(service)}
                                  />
                                ))}
                              </div>
                              
                              {/* See More button if there are more than 6 services */}
                              {hasMore && !isExpanded && (
                                <button
                                  onClick={() => handleExpandSubcategory(subcategory)}
                                  className="text-sm text-[#3A3A3A] hover:text-[#EECFD1] font-medium underline"
                                >
                                  See more
                                </button>
                              )}
                              {hasMore && isExpanded && (
                                <button
                                  onClick={() => handleExpandSubcategory(subcategory)}
                                  className="text-sm text-[#3A3A3A] hover:text-[#EECFD1] font-medium underline"
                                >
                                  Show less
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()
                ) : (
                  // Horizontal scroll for other categories
                  <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4">
                    {sidePanelServices.map((service) => (
                      <ServiceCard
                        key={service.id}
                        {...formatServiceForCard(service)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
