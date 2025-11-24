"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

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
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="flex items-center text-[#3A3A3A]/70 hover:text-[#3A3A3A] mb-6 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Service Header */}
                <div className="mb-8">
                  <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">
                    {service.serviceName}
                  </h1>
                  
                  {service.category && (
                    <div className="flex items-center gap-4 mb-4">
                      <span className="px-3 py-1 bg-[#EECFD1]/20 text-[#3A3A3A] rounded-full text-sm font-semibold">
                        {service.category}
                      </span>
                      {service.subCategory && (
                        <span className="px-3 py-1 bg-gray-100 text-[#3A3A3A] rounded-full text-sm">
                          {service.subCategory}
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-6 text-[#3A3A3A]/70 mb-6">
                    {service.duration && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{service.duration}</span>
                      </div>
                    )}
                    {service.address && (
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{service.address}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-3xl font-bold text-[#3A3A3A] mb-6">
                    ${service.baseCost?.toFixed(2) || "0.00"}
                  </div>
                </div>

                {/* Description */}
                {service.description && (
                  <div className="card-polished p-6 mb-8">
                    <h2 className="text-xl font-bold text-[#3A3A3A] mb-4">Description</h2>
                    <p className="text-[#3A3A3A]/80 leading-relaxed whitespace-pre-line">
                      {service.description}
                    </p>
                  </div>
                )}

                {/* Add-ons */}
                {service.addOns && service.addOns.length > 0 && (
                  <div className="card-polished p-6 mb-8">
                    <h2 className="text-xl font-bold text-[#3A3A3A] mb-4">Add-ons</h2>
                    <div className="space-y-3">
                      {service.addOns.map((addOn: any, index: number) => (
                        <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                          <span className="text-[#3A3A3A]">{addOn.name}</span>
                          <span className="font-semibold text-[#3A3A3A]">+${addOn.cost?.toFixed(2) || "0.00"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Time Slots */}
                {service.timeSlots && service.timeSlots.length > 0 && (
                  <div className="card-polished p-6 mb-8">
                    <h2 className="text-xl font-bold text-[#3A3A3A] mb-4">Available Time Slots</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {service.timeSlots.slice(0, 6).map((slot: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg border-2 text-center ${
                            slot.isBooked
                              ? "border-gray-200 bg-gray-50 text-gray-400"
                              : "border-[#EECFD1] bg-white hover:bg-[#EECFD1]/10 cursor-pointer"
                          }`}
                        >
                          <div className="text-sm font-semibold text-[#3A3A3A]">
                            {new Date(slot.date).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-[#3A3A3A]/70 mt-1">
                            {slot.startTime} - {slot.endTime}
                          </div>
                          {slot.isBooked && (
                            <div className="text-xs text-red-500 mt-1">Booked</div>
                          )}
                        </div>
                      ))}
                    </div>
                    {service.timeSlots.length > 6 && (
                      <p className="text-sm text-[#3A3A3A]/70 mt-4">
                        +{service.timeSlots.length - 6} more time slots available
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="card-polished p-6 sticky top-24">
                  {/* Business Info */}
                  {business && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      <h3 className="text-lg font-bold text-[#3A3A3A] mb-3">Business</h3>
                      <div className="flex items-start gap-3">
                        {business.logo && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={business.logo}
                            alt={business.businessName}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <Link
                            href={`/businesses/${business._id || business.id}`}
                            className="font-semibold text-[#3A3A3A] hover:text-black transition-colors"
                          >
                            {business.businessName}
                          </Link>
                          {business.address && (
                            <p className="text-sm text-[#3A3A3A]/70 mt-1">
                              {business.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pricing */}
                  <div className="mb-6">
                    <div className="flex justify-between items-baseline mb-4">
                      <span className="text-[#3A3A3A]/70">Base Price</span>
                      <span className="text-2xl font-bold text-[#3A3A3A]">
                        ${service.baseCost?.toFixed(2) || "0.00"}
                      </span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <button
                    onClick={() => {
                      // TODO: Navigate to booking page
                      alert("Booking functionality coming soon!");
                    }}
                    className="w-full btn-polished btn-polished-primary"
                  >
                    Book Now
                  </button>

                  {/* Status */}
                  {service.status && (
                    <div className="mt-4 text-center">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        service.status === 'listed'
                          ? 'bg-green-100 text-green-800'
                          : service.status === 'booked'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
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

