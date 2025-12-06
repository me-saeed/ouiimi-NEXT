"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";

interface ListTabProps {
  business: any;
}

interface Service {
  id: string;
  _id: string;
  category: string;
  subCategory?: string;
  serviceName: string;
  duration: string;
  baseCost: number;
  description?: string;
  status: string;
  timeSlots?: any[];
  businessId?: any;
}

export function ListTab({ business }: ListTabProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (business?.id || business?._id) {
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const loadServices = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;

      const response = await fetch(`/api/services?businessId=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setServices(data.services || []);
      } else {
        setError("Failed to load services");
      }
    } catch (e) {
      console.error("Error loading services:", e);
      setError("Failed to load services");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (serviceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setServiceToDelete(serviceId);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    setIsDeleting(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in to delete services");
        setIsDeleting(false);
        return;
      }

      const response = await fetch(`/api/services/${serviceToDelete}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setShowDeleteModal(false);
        setServiceToDelete(null);
        loadServices();
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to delete service");
        if (errorData.error?.includes("active bookings")) {
          setError("Cannot delete service with active bookings. Please cancel or complete all bookings first.");
        }
      }
    } catch (error: any) {
      console.error("Error deleting service:", error);
      setError(error.message || "Failed to delete service. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setServiceToDelete(null);
    setError("");
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const getNextAvailableTimeSlot = (service: Service) => {
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

  const formatServiceForCard = (service: Service) => {
    const { date, time } = getNextAvailableTimeSlot(service);
    const serviceBusiness = typeof service.businessId === 'object' ? service.businessId : null;
    const businessData = serviceBusiness || (typeof business === 'object' ? business : null);

    return {
      id: service.id || service._id,
      name: service.serviceName,
      price: service.baseCost,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: businessData?.businessName || "Business",
      location: businessData?.address || "",
      duration: service.duration,
      date: date,
      time: time,
    };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 px-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3A3A3A]">Your Services</h2>
          <p className="text-sm text-[#888888] mt-1">
            Manage your service listings visible to customers
          </p>
        </div>
        <Link href="/business/services/create">
          <Button className="bg-[#EECFD1] text-white hover:bg-[#e5c4c7] rounded-xl px-6 py-2.5 font-semibold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Add Service
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1] mx-auto"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#F5F5F5] shadow-sm">
          <div className="w-16 h-16 rounded-full bg-[#EECFD1]/10 flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-[#EECFD1]" />
          </div>
          <h3 className="text-lg font-semibold text-[#3A3A3A] mb-2">No services yet</h3>
          <p className="text-[#888888] mb-6">Start by creating your first service listing</p>
          <Link href="/business/services/create">
            <Button className="bg-[#EECFD1] text-white hover:bg-[#e5c4c7] rounded-xl px-6 py-2.5 font-semibold">
              Create First Service
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-bold text-[#3A3A3A] pb-2 border-b border-[#F5F5F5]">{category}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {categoryServices.map((service) => {
                  const serviceId = service.id || service._id;
                  const cardData = formatServiceForCard(service);
                  return (
                    <div
                      key={serviceId}
                      className="relative"
                    >
                      <div
                        onClick={() => router.push(`/business/services/${serviceId}`)}
                        className="cursor-pointer [&_a]:pointer-events-none"
                      >
                        <ServiceCard {...cardData} />
                      </div>
                      {/* Action Buttons - Top Right Corner of Service Card */}
                      <div className="absolute top-2 right-2 flex gap-3 z-20 pointer-events-none">
                        {/* Edit Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/business/services/${serviceId}/edit`);
                          }}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors pointer-events-auto bg-white/90 backdrop-blur-sm"
                          title="Edit Service"
                        >
                          <Pencil className="w-5 h-5 text-gray-500" strokeWidth={2} />
                        </button>
                        {/* Delete Button */}
                        <button
                          onClick={(e) => handleDeleteClick(serviceId, e)}
                          className="p-2 hover:bg-red-100/50 rounded-lg transition-colors pointer-events-auto bg-white/90 backdrop-blur-sm"
                          title="Delete Service"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" strokeWidth={2} />
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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#3A3A3A]">Delete Service</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700 mb-2">Note:</p>
              <p className="text-sm text-gray-600">
                Services with <strong>active future bookings</strong> cannot be deleted. Active bookings are:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Confirmed or pending bookings</li>
                <li>Scheduled for a future date (not yet completed)</li>
              </ul>
              <p className="text-sm text-gray-600 mt-2">
                <strong>You can delete services with:</strong> past bookings, completed bookings, or cancelled bookings.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                To delete this service, cancel any future bookings first.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                variant="outline"
                className="flex-1 h-11 rounded-xl border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete Service"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
