"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Plus, Tag, Edit, Trash2 } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function BusinessServicesPage() {
  const router = useRouter();
  const [services, setServices] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      if (isAuthenticated && user) {
        loadBusinessAndServices(user);
      } else {
        router.push("/signin?redirect=/business/services");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated, user, router]);

  const loadBusinessAndServices = async (userData: any) => {
    try {
      const userId = userData.id || userData._id;

      if (!userId) {
        console.error("User ID not found");
        setIsLoading(false);
        return;
      }

      // First, find the business for this user
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        credentials: "include",
      });

      if (!businessResponse.ok) {
        console.error("Failed to fetch business:", businessResponse.status);
        setIsLoading(false);
        return;
      }

      const businessData = await businessResponse.json();
      if (businessData.businesses && businessData.businesses.length > 0) {
        const foundBusiness = businessData.businesses[0];
        const foundBusinessId = foundBusiness.id || foundBusiness._id;
        setBusinessId(foundBusinessId);

        // Now load services for this business
        const servicesResponse = await fetch(`/api/services?businessId=${foundBusinessId}`, {
          credentials: "include",
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          if (servicesData.services) {
            console.log('[Services Debug] Received services:', servicesData.services);
            console.log('[Services Debug] First service:', servicesData.services[0]);
            setServices(servicesData.services);
          }
        } else {
          console.error("Failed to fetch services:", servicesResponse.status);
        }
      } else {
        // No business found - this is okay, services list will be empty
        console.log("No business found for user");
      }
    } catch (error: any) {
      console.error("Error loading business and services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (serviceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;

    try {
      if (!isAuthenticated) {
        alert("Please sign in to delete services");
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        // Reload services after deletion
        loadBusinessAndServices(user);
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete service");
      }
    } catch (error: any) {
      console.error("Error deleting service:", error);
      alert(error.message || "Failed to delete service. Please try again.");
    }
  };

  // Group services by category
  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, any[]>);

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
    const businessData = typeof service.businessId === 'object' ? service.businessId : null;

    // Extract duration from service or first time slot
    const duration = service.duration
      || (service.timeSlots && service.timeSlots.length > 0 ? service.timeSlots[0]?.duration : null)
      || 60; // Default to 60 minutes if not found

    const cardData = {
      id: service.id || service._id,
      name: service.serviceName,
      price: service.timeSlots && service.timeSlots.length > 0 ? (service.timeSlots[0]?.price || 0) : 0,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: businessData?.businessName || "Business",
      location: businessData?.address || "",
      duration: `${duration} min`,
      date: date,
      time: time,
    };

    console.log('[Card Format Debug] Service:', service.serviceName);
    console.log('[Card Format Debug] Duration extracted:', duration);
    console.log('[Card Format Debug] Date/Time:', { date, time });
    console.log('[Card Format Debug] Card data:', cardData);

    return cardData;
  };

  if (!user) {
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] mb-2">Your Services</h1>
              <p className="text-[#888888]">Manage and organize your service offerings</p>
            </div>
            <Link
              href="/business/services/create"
              className="bg-[#EECFD1] text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-[#e5c4c7] transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Service
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F5F5F5] p-16 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#EECFD1]/10 flex items-center justify-center mx-auto mb-6">
                <Plus className="w-10 h-10 text-[#EECFD1]" />
              </div>
              <h2 className="text-2xl font-bold text-[#3A3A3A] mb-3">No services yet</h2>
              <p className="text-[#888888] mb-8 text-lg">
                Start growing your business by creating your first service listing
              </p>
              <Link
                href="/business/services/create"
                className="inline-block bg-[#EECFD1] text-white px-8 py-3.5 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-[#e5c4c7] transition-all"
              >
                Create Your First Service
              </Link>
            </div>
          ) : (
            <div className="space-y-10">
              {(Object.entries(groupedServices) as [string, any[]][]).map(([category, categoryServices]) => {
                // Group services by subcategory within this category
                const groupedBySubcategory = categoryServices.reduce((acc, service) => {
                  const subCategory = service.subCategory || "Other";
                  if (!acc[subCategory]) {
                    acc[subCategory] = [];
                  }
                  acc[subCategory].push(service);
                  return acc;
                }, {} as Record<string, any[]>);

                return (
                  <div key={category} className="space-y-6 pb-8 mb-8 border-b-4 border-gray-100 last:border-b-0">
                    {/* Category Header */}
                    <div className="flex items-center gap-3 pb-4 border-b-2 border-[#EECFD1]/30 bg-gradient-to-r from-[#EECFD1]/5 to-transparent px-4 py-3 rounded-lg">
                      <Tag className="w-6 h-6 text-[#EECFD1]" />
                      <h2 className="text-2xl font-bold text-[#3A3A3A]">{category}</h2>
                      <span className="ml-auto bg-[#EECFD1]/20 text-[#EECFD1] px-4 py-1.5 rounded-full text-sm font-semibold">
                        {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}
                      </span>
                    </div>

                    {/* Subcategories */}
                    <div className="space-y-8">
                      {(Object.entries(groupedBySubcategory) as [string, any[]][]).map(([subCategory, subCategoryServices]) => (
                        <div key={subCategory} className="space-y-3">
                          {/* Subcategory Header */}
                          <h3 className="text-xl font-medium text-[#3A3A3A] mb-4">
                            {subCategory}
                          </h3>

                          {/* Services List for this subcategory */}
                          <div className="flex flex-col gap-3">
                            {subCategoryServices.map((service) => {
                              const serviceId = service.id || service._id;
                              const cardData = formatServiceForCard(service);
                              return (
                                <div
                                  key={serviceId}
                                  onClick={() => router.push(`/business/services/${serviceId}`)}
                                  className="relative cursor-pointer [&_a]:pointer-events-none group w-full"
                                >
                                  <ServiceCard {...cardData} />
                                  {/* Edit Button - Top Right Corner */}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      router.push(`/business/services/${serviceId}/edit`);
                                    }}
                                    className="absolute top-2 right-2 bg-white hover:bg-gray-50 rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Edit Service"
                                  >
                                    <Edit className="w-4 h-4 text-gray-700" />
                                  </button>
                                  {/* Delete Button - Top Left Corner */}
                                  <button
                                    onClick={(e) => handleDelete(serviceId, e)}
                                    className="absolute top-2 left-2 bg-white hover:bg-red-50 rounded-lg p-2 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                    title="Delete Service"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

