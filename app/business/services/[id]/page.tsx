"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trash2, Edit } from "lucide-react";

export default function ServiceDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
        loadService();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const loadService = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/services/${serviceId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

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
            setBusiness(data.service.businessId);
          } else {
            const businessId = typeof data.service.businessId === 'object' 
              ? data.service.businessId._id || data.service.businessId.id
              : data.service.businessId;
            
            if (businessId) {
              const businessResponse = await fetch(`/api/business/${businessId}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
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

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this service? This action cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push("/business/services");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete service");
      }
    } catch (err: any) {
      console.error("Error deleting service:", err);
      setError("Failed to delete service. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

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

  if (error && !service) {
    return (
      <PageLayout user={user || null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">
                Service Not Found
              </h1>
              <p className="text-[#3A3A3A]/70 mb-8">{error}</p>
              <Button
                onClick={() => router.push("/business/services")}
                className="bg-[#EECFD1] text-white hover:bg-[#EECFD1]/90"
              >
                Back to Services
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user || null}>
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {error && (
              <Alert className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            <div className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
              <div className="p-8 space-y-6">
                {/* Header with Edit Button */}
                <div className="flex items-start justify-between pb-6 border-b border-gray-200">
                  <div className="flex-1">
                    <h1 className="text-3xl font-bold text-[#3A3A3A] mb-2">
                      {service?.serviceName || "Service Details"}
                    </h1>
                    {service?.category && (
                      <p className="text-sm text-gray-500 uppercase tracking-wide">
                        {service.category}
                      </p>
                    )}
                  </div>
                  <Button
                    onClick={() => router.push(`/business/services/${serviceId}/edit`)}
                    variant="outline"
                    className="rounded-xl border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>

                {/* Service Details */}
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Duration
                    </label>
                    <p className="text-base font-semibold text-[#3A3A3A]">{service?.duration || "N/A"}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Base Cost
                    </label>
                    <p className="text-base font-semibold text-[#3A3A3A]">${service?.baseCost?.toFixed(2) || "0.00"}</p>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                      Address
                    </label>
                    <p className="text-sm text-[#3A3A3A]">
                      {service?.address || (business?.address) || "N/A"}
                    </p>
                  </div>

                  {service?.description && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Description
                      </label>
                      <p className="text-sm text-[#3A3A3A] leading-relaxed">{service.description}</p>
                    </div>
                  )}

                  {/* Time Slots Summary */}
                  {service?.timeSlots && service.timeSlots.length > 0 && (
                    <div>
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">
                        Available Time Slots
                      </label>
                      <p className="text-sm text-[#3A3A3A]">
                        {service.timeSlots.filter((slot: any) => !slot.isBooked).length} available slots
                      </p>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <div className="pt-6 border-t border-gray-200">
                  <Button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    variant="outline"
                    className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {isDeleting ? "Deleting..." : "Delete Service"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

