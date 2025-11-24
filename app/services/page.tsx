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
    <div className="bg-white min-h-screen py-12">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-[#3A3A3A]">
              {category ? category : "All Services"}
            </h1>
            {category && (
              <Link
                href="/services"
                className="text-sm text-[#3A3A3A]/70 hover:text-[#3A3A3A] transition-colors font-medium inline-flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                View all
              </Link>
            )}
          </div>
          {category && (
            <p className="text-[#3A3A3A]/70 text-sm">
              Browse all services in {category}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="card-polished p-12 text-center max-w-md mx-auto">
            <p className="text-[#3A3A3A] font-semibold text-lg">No services found</p>
            <p className="text-[#3A3A3A]/70 text-sm mt-2">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
            {services.map((service) => (
              <Link
                key={service.id}
                href={`/services/${service.id}`}
                className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 border border-gray-100"
              >
                <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                  <div className="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <span className="text-[#3A3A3A] text-sm font-medium">
                      {service.serviceName}
                    </span>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm text-[#3A3A3A] font-semibold truncate mb-2 leading-tight">
                    {service.serviceName}
                  </p>
                  <p className="text-base font-bold text-[#3A3A3A]">
                    ${service.baseCost}
                  </p>
                  {service.businessId && typeof service.businessId === 'object' && (
                    <p className="text-xs text-[#3A3A3A]/60 mt-1 truncate">
                      {service.businessId.businessName}
                    </p>
                  )}
                </div>
              </Link>
            ))}
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

