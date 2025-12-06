"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceCarousel } from "@/components/ui/service-carousel";
import { ArrowRight } from "lucide-react";
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
  baseCost: number;
  duration: string;
  category: string;
  subCategory?: string;
  businessId: any;
  timeSlots?: Array<{
    date: string;
    startTime: string;
    endTime: string;
    cost?: number;
  }>;
}

export default function HomePage() {
  const { user } = useAuth();
  const [services, setServices] = useState<Record<string, Service[]>>({});
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
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
              servicesData[category] = data.services || [];
              // Get total count from pagination
              countsData[category] = data.pagination?.total || data.services?.length || 0;
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

  const getNextAvailableTimeSlot = (service: Service) => {
    if (!service.timeSlots || service.timeSlots.length === 0) {
      return { date: null, time: null };
    }

    const now = new Date();
    const availableSlots = service.timeSlots
      .filter((slot) => {
        const slotDate = new Date(slot.date);
        return slotDate >= now;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

  const formatServiceForCard = (service: Service) => {
    const { date, time } = getNextAvailableTimeSlot(service);
    const business = typeof service.businessId === 'object' ? service.businessId : null;

    return {
      id: service.id,
      name: service.serviceName,
      price: service.baseCost,
      image: business?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: business?.businessName || "Business",
      location: business?.address || "",
      duration: service.duration,
      date: date,
      time: time,
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
      </div>
    </PageLayout>
  );
}
