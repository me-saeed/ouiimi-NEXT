"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";

function ServicesContent() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  const loadServices = async () => {
    try {
      const url = category
        ? `/api/services?category=${encodeURIComponent(category)}`
        : "/api/services";
      const response = await fetch(url);
      const data = await response.json();
      if (data.services) {
        setServices(data.services);
      }
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            {category ? category : "All Services"}
          </h1>
          {category && (
            <div className="flex items-center justify-center gap-4">
              <p className="text-muted-foreground text-lg">
                Browse all services in {category}
              </p>
              <Link
                href="/services"
                className="text-sm text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                View all
              </Link>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-12 text-center max-w-md mx-auto">
            <p className="text-foreground font-semibold text-lg mb-2">No services found</p>
            <p className="text-muted-foreground text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6 w-full max-w-7xl">
              {services.map((service) => {
                const business = typeof service.businessId === 'object' ? service.businessId : null;
                return (
                  <Link
                    key={service.id}
                    href={`/services/${service.id}`}
                    className="group bg-card rounded-2xl overflow-hidden border border-border/50 shadow-sm hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 flex flex-col"
                  >
                    {/* Business Logo */}
                    <div className="p-5 pb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0 border border-border/50 shadow-sm">
                          {business?.logo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={business.logo}
                              alt={business.businessName || "Business"}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-base font-bold text-muted-foreground">
                              {business?.businessName?.charAt(0) || "B"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-muted-foreground truncate">
                            {business?.businessName || "Business"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Service Info */}
                    <div className="px-5 pb-5 space-y-3 flex-1 flex flex-col">
                      <h3 className="font-bold text-foreground line-clamp-2 text-base leading-tight group-hover:text-primary transition-colors min-h-[2.5rem]">
                        {service.serviceName}
                      </h3>
                      
                      <div className="space-y-2 text-xs text-muted-foreground flex-1">
                        {service.duration && (
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium">{service.duration}</span>
                          </div>
                        )}
                        {service.address && (
                          <div className="flex items-start gap-2">
                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="line-clamp-2">{service.address}</span>
                          </div>
                        )}
                      </div>

                      {/* Price */}
                      <div className="flex items-center justify-between pt-4 border-t border-border/50 mt-auto">
                        <p className="font-bold text-2xl text-foreground">
                          ${(service.baseCost || 0).toFixed(2)}
                        </p>
                        <div className="text-primary group-hover:translate-x-1 transition-transform">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="bg-white min-h-screen py-12"><div className="container mx-auto px-4"><p className="text-[#3A3A3A]">Loading...</p></div></div>}>
        <ServicesContent />
      </Suspense>
    </PageLayout>
  );
}

