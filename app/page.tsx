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
            // Fetch more than 6 services to ensure we have enough after potential server-side filtering
            const response = await fetch(
              `/api/services?category=${encodeURIComponent(category)}&status=listed&limit=12`
            );

            if (response.ok) {
              const data = await response.json();
              // Services already filtered for available slots by API
              servicesData[category] = data.services || [];
              // Use pagination total from API
              countsData[category] = data.pagination?.total || data.services?.length || 0;
            } else {
              servicesData[category] = [];
              countsData[category] = 0;
            }
          } catch (error) {
            console.error(`Error fetching ${category} services:`, error);
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
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex justify-center">
              <Link
                href="/services"
                className="text-[18px] font-medium text-[#3A3A3A] border-b border-[#3A3A3A] pb-0.5 hover:opacity-70 transition-opacity"
              >
                Book
              </Link>
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <section className="py-4 md:py-8 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-[#3A3A3A] mb-4 sm:mb-5 md:mb-6 text-left">
              Discover
            </h1>

            {SERVICE_CATEGORIES.map((category, categoryIndex) => {
              const categoryServices = services[category] || [];
              const totalCount = serviceCounts[category] || 0;

              if (isLoading) return null; // Or skeleton
              if (categoryServices.length === 0) return null;

              return (
                <div key={category}>
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <h2 className="text-[20px] md:text-[24px] font-bold text-[#3A3A3A]">{category}</h2>
                  </div>

                  {/* Horizontal Scroll Container */}
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                      {categoryServices.slice(0, 6).map((service) => (
                        <div key={service.id} className="min-w-[300px] sm:min-w-[320px] flex-shrink-0">
                          <ServiceCard
                            {...formatServiceForCard(service)}
                          />
                        </div>
                      ))}

                      {/* "See More" Card at the end of scroll */}
                      {totalCount > 6 && (
                        <div className="min-w-[120px] flex items-center justify-center flex-shrink-0">
                          <Link
                            href={`/category/${encodeURIComponent(category)}`}
                            className="flex flex-col items-center gap-2 text-sm font-medium text-[#3A3A3A] hover:text-[#EECFD1] transition-colors group"
                          >
                            <div className="w-10 h-10 rounded-full bg-[#EECFD1]/20 group-hover:bg-[#EECFD1]/30 flex items-center justify-center transition-colors">
                              <ArrowRight className="w-5 h-5 text-[#3A3A3A]" />
                            </div>
                            See more
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
