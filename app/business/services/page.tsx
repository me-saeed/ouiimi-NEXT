"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Plus, Clock, DollarSign, Edit2, Trash2, Calendar, Tag } from "lucide-react";

export default function BusinessServicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadBusinessAndServices();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadBusinessAndServices = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/signin");
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id || parsedUser._id;

      if (!userId) {
        console.error("User ID not found");
        setIsLoading(false);
        return;
      }

      // First, find the business for this user
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (servicesResponse.ok) {
          const servicesData = await servicesResponse.json();
          if (servicesData.services) {
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

  const handleDelete = async (serviceId: string) => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please sign in to delete services");
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Reload services after deletion
        loadBusinessAndServices();
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
              {(Object.entries(groupedServices) as [string, any[]][]).map(([category, categoryServices]) => (
                <div key={category} className="space-y-6">
                  {/* Category Header */}
                  <div className="flex items-center gap-3 pb-3 border-b-2 border-[#F5F5F5]">
                    <Tag className="w-5 h-5 text-[#EECFD1]" />
                    <h2 className="text-2xl font-bold text-[#3A3A3A]">{category}</h2>
                    <span className="ml-auto bg-[#EECFD1]/10 text-[#EECFD1] px-3 py-1 rounded-full text-sm font-semibold">
                      {categoryServices.length} {categoryServices.length === 1 ? 'service' : 'services'}
                    </span>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {categoryServices.map((service) => {
                      const serviceId = service.id || service._id;
                      return (
                        <div
                          key={serviceId}
                          className="bg-white rounded-2xl border border-[#F5F5F5] overflow-hidden hover:border-[#EECFD1] hover:shadow-lg transition-all duration-300 group"
                        >
                          {/* Service Content */}
                          <div className="p-6 space-y-4">
                            {/* Title and Sub-category */}
                            <div>
                              <h3 className="text-lg font-bold text-[#3A3A3A] mb-2 line-clamp-2 group-hover:text-[#EECFD1] transition-colors">
                                {service.serviceName}
                              </h3>
                              {service.subCategory && (
                                <span className="inline-block px-3 py-1 bg-[#F5F5F5] text-[#888888] rounded-full text-xs font-medium uppercase tracking-wide">
                                  {service.subCategory}
                                </span>
                              )}
                            </div>

                            {/* Price and Duration */}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-[#EECFD1]" />
                                <span className="text-2xl font-bold text-[#3A3A3A]">
                                  ${service.baseCost?.toFixed(2) || "0.00"}
                                </span>
                              </div>
                              {service.duration && (
                                <div className="flex items-center gap-2 text-[#888888]">
                                  <Clock className="w-4 h-4 text-[#EECFD1]" />
                                  <span className="text-sm">{service.duration}</span>
                                </div>
                              )}
                              {service.timeSlots && service.timeSlots.length > 0 && (
                                <div className="flex items-center gap-2 text-[#888888]">
                                  <Calendar className="w-4 h-4 text-[#EECFD1]" />
                                  <span className="text-sm">{service.timeSlots.length} time slot{service.timeSlots.length !== 1 ? 's' : ''}</span>
                                </div>
                              )}
                            </div>

                            {/* Description */}
                            {service.description && (
                              <p className="text-sm text-[#888888] line-clamp-3 leading-relaxed">
                                {service.description}
                              </p>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex border-t border-[#F5F5F5]">
                            <Link
                              href={`/business/services/${serviceId}/edit`}
                              className="flex-1 flex items-center justify-center gap-2 py-3 text-[#EECFD1] font-semibold hover:bg-[#EECFD1] hover:text-white transition-all"
                            >
                              <Edit2 className="w-4 h-4" />
                              <span className="text-sm">Edit</span>
                            </Link>
                            <button
                              onClick={() => handleDelete(serviceId)}
                              className="flex-1 flex items-center justify-center gap-2 py-3 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all border-l border-[#F5F5F5]"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm">Delete</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

