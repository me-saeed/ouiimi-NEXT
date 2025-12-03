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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen">
        {/* Book Now Button */}
        <div className="py-8 md:py-12 flex justify-center">
          <Button
            size="lg"
            className="h-12 px-8 rounded-xl btn-polished-primary shadow-lg hover:shadow-xl font-semibold text-base"
            asChild
          >
            <Link href="/services" className="inline-flex items-center gap-2">
              <span>Book Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </Button>
        </div>

        {/* Search Section */}
        <section className="bg-gradient-to-b from-background via-secondary/5 to-background border-b border-border/40 py-12 md:py-16 relative overflow-hidden">
          <div className="container relative z-10">
            <div className="max-w-3xl mx-auto">
              <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <Input
                      type="text"
                      placeholder="Search services..."
                      className="pl-12 h-12 bg-background border-border focus:ring-2 focus:ring-primary/20 text-base"
                    />
                  </div>
                  <Button size="lg" className="h-12 px-8 rounded-xl btn-polished-primary font-semibold">
                    Search
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-12 md:py-16 space-y-16 md:space-y-20 bg-background">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">

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
