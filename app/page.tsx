"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceCarousel } from "@/components/ui/service-carousel";
import { ArrowRight } from "lucide-react";

const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Dog Grooming",
];

const CATEGORIES_WITH_SUBCATEGORIES = ["Hair Services", "Dog Grooming"];

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
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Record<string, Service[]>>({});
  const [isLoading, setIsLoading] = useState(true);

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

    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      const servicesData: Record<string, Service[]> = {};
      
      // Fetch services for each category
      await Promise.all(
        SERVICE_CATEGORIES.map(async (category) => {
          try {
            const response = await fetch(
              `/api/services?category=${encodeURIComponent(category)}&status=listed&limit=6`
            );
            if (response.ok) {
              const data = await response.json();
              servicesData[category] = data.services || [];
            } else {
              servicesData[category] = [];
            }
          } catch (error) {
            console.error(`Error loading services for ${category}:`, error);
            servicesData[category] = [];
          }
        })
      );

      setServices(servicesData);
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

  const groupServicesBySubCategory = (services: Service[]) => {
    const grouped: Record<string, Service[]> = {};
    services.forEach((service) => {
      const key = service.subCategory || "Other";
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(service);
    });
    return grouped;
  };

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen">
        {/* Book Button - Below Nav */}
        <div className="bg-white py-4 border-b border-gray-200">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-center">
              <Link
                href="/services"
                className="bg-[#EECFD1] text-[#3A3A3A] px-8 py-2.5 rounded-lg font-semibold hover:bg-[#EECFD1]/90 transition-colors shadow-sm"
              >
                Book
              </Link>
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <section className="py-8 md:py-12 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] mb-8 md:mb-12 text-center">
              Discover
            </h1>

            {/* Service Categories */}
            {SERVICE_CATEGORIES.map((category, categoryIndex) => {
              const categoryServices = services[category] || [];
              
              if (isLoading) {
                return (
                  <div key={category} className="space-y-6">
                    <div className="flex items-center justify-between px-4 md:px-6">
                      <h2 className="text-2xl md:text-3xl font-bold text-foreground">{category}</h2>
                    </div>
                    <div className="flex gap-4 md:gap-6 overflow-x-auto px-4 md:px-6">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="bg-muted animate-pulse rounded-xl w-[280px] md:w-[320px] h-[200px] flex-shrink-0" />
                      ))}
                    </div>
                  </div>
                );
              }

              if (categoryServices.length === 0) {
                return null;
              }

              // Handle sub-categories for Hair Services and Dog Grooming
              if (CATEGORIES_WITH_SUBCATEGORIES.includes(category)) {
                const grouped = groupServicesBySubCategory(categoryServices);
                return (
                  <div
                    key={category}
                    className="space-y-12"
                  >
                    {Object.entries(grouped).map(([subCategory, subServices]) => (
                      <ServiceCarousel
                        key={subCategory}
                        title={`${category} - ${subCategory}`}
                        viewAllHref={`/services?category=${encodeURIComponent(category)}&subCategory=${encodeURIComponent(subCategory)}`}
                      >
                        {subServices.map((service) => (
                          <ServiceCard
                            key={service.id}
                            {...formatServiceForCard(service)}
                          />
                        ))}
                      </ServiceCarousel>
                    ))}
                  </div>
                );
              }

              // Regular category display
              return (
                <ServiceCarousel
                  key={category}
                  title={category}
                  viewAllHref={`/services?category=${encodeURIComponent(category)}`}
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
        </section>
      </div>
    </PageLayout>
  );
}
