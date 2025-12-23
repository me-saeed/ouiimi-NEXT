"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceEditModal } from "./ServiceEditModal";

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (business?.id || business?._id) {
      loadServices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const loadServices = async () => {
    if (!business?.id && !business?._id) {
      console.warn("[ListTab] No business ID available, skipping service load");
      return;
    }

    console.log("[ListTab] Loading services for business:", business.id || business._id);
    console.time("[ListTab] loadServices execution");

    setIsLoading(true);
    setError("");
    try {
      const businessId = business.id || business._id;

      console.log("[ListTab] Fetching services from API...");
      const response = await fetch(`/api/services?businessId=${businessId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
      });

      console.log("[ListTab] API response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("[ListTab] Services received:", data.services?.length || 0);
        console.log("[ListTab] Services data:", data.services);
        setServices(data.services || []);
        console.timeEnd("[ListTab] loadServices execution");
      } else {
        const errorText = await response.text();
        console.error("[ListTab] Failed to load services:", response.status, errorText);
        setError("Failed to load services");
        console.timeEnd("[ListTab] loadServices execution");
      }
    } catch (e) {
      console.error("[ListTab] Error loading services:", e);
      console.error("[ListTab] Error stack:", (e as Error).stack);
      setError("Failed to load services");
      console.timeEnd("[ListTab] loadServices execution");
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
      const response = await fetch(`/api/services/${serviceToDelete}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
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

  const handleEditClick = (serviceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingServiceId(serviceId);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditModalOpen(false);
    setEditingServiceId(null);
    loadServices();
  };

  // Separate services into active (has future time slots) and pending (no slots)
  const today = new Date().toISOString().split('T')[0];
  const activeServices = services.filter(service => {
    if (!service.timeSlots || service.timeSlots.length === 0) return false;
    // Check if any time slot is in the future
    return service.timeSlots.some((slot: any) => slot.date >= today);
  });
  const pendingServices = services.filter(service => {
    if (!service.timeSlots || service.timeSlots.length === 0) return true;
    // No future time slots
    return !service.timeSlots.some((slot: any) => slot.date >= today);
  });

  const groupedServices = activeServices.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

  const formatTime12Hour = (time24: string): string => {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "pm" : "am";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
  };

  const getNextAvailableTimeSlot = (service: Service) => {
    if (!service.timeSlots || service.timeSlots.length === 0) {
      return { date: null, time: null, price: 0, duration: null };
    }

    const now = new Date();
    const availableSlots = service.timeSlots
      .filter((slot: any) => !slot.isBooked)
      .filter((slot: any) => {
        const slotDate = new Date(slot.date);
        const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // If slot date is today, check if end time has passed
        if (slotDateOnly.getTime() === nowDateOnly.getTime()) {
          const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
          const slotEndDateTime = new Date(slotDate);
          slotEndDateTime.setHours(endHours, endMinutes, 0, 0);
          return slotEndDateTime > now;
        }

        // If slot date is in the future
        return slotDateOnly > nowDateOnly;
      })
      .sort((a: any, b: any) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        // If same date, sort by start time
        const [hoursA, minsA] = a.startTime.split(":").map(Number);
        const [hoursB, minsB] = b.startTime.split(":").map(Number);
        return (hoursA * 60 + minsA) - (hoursB * 60 + minsB);
      });

    if (availableSlots.length === 0) {
      return { date: null, time: null, price: 0, duration: null };
    }

    const nextSlot = availableSlots[0];
    const date = new Date(nextSlot.date);
    // Format date as DD.MM.YY
    const formattedDate = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getFullYear()).slice(-2)}`;
    // Format time as "10:00 am - 12:00 pm"
    const time = `${formatTime12Hour(nextSlot.startTime)} - ${formatTime12Hour(nextSlot.endTime)}`;
    const price = nextSlot.price || 0;
    const duration = nextSlot.duration;

    return { date: formattedDate, time, price, duration };
  };

  const formatServiceForCard = (service: Service) => {
    const { date, time, price, duration } = getNextAvailableTimeSlot(service);
    const serviceBusiness = typeof service.businessId === 'object' ? service.businessId : null;
    const businessData = serviceBusiness || (typeof business === 'object' ? business : null);

    // Format duration string
    let durationStr = "";
    if (duration) {
      const hours = Math.floor(duration / 60);
      const mins = duration % 60;
      if (hours > 0 && mins > 0) {
        durationStr = `${hours}Hr ${mins}mins`;
      } else if (hours > 0) {
        durationStr = `${hours}Hr`;
      } else {
        durationStr = `${mins}mins`;
      }
    }

    return {
      id: service.id || service._id,
      name: service.serviceName,
      price: price || 0,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: businessData?.businessName || "Business",
      location: businessData?.address || "",
      duration: durationStr,
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
            Manage your services
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
        <div className="space-y-10">
          {Object.entries(groupedServices).map(([category, categoryServices]) => {
            // Group services by subcategory within this category
            const groupedBySubcategory = categoryServices.reduce((acc, service) => {
              const subCategory = service.subCategory || "Other";
              if (!acc[subCategory]) {
                acc[subCategory] = [];
              }
              acc[subCategory].push(service);
              return acc;
            }, {} as Record<string, Service[]>);

            return (
              <div key={category} className="space-y-6 pb-8 border-b-2 border-gray-100 last:border-b-0">
                {/* Category Header */}
                <div className="pb-3 px-4 py-3">
                  <h2 className="text-2xl font-bold text-[#3A3A3A] truncate">{category}</h2>
                </div>

                {/* Subcategories */}
                <div className="space-y-6">
                  {Object.entries(groupedBySubcategory).map(([subCategory, subCategoryServices]) => (
                    <div key={subCategory} className="space-y-3 pl-4">
                      {/* Subcategory Header */}
                      <h3 className="text-lg font-semibold text-[#5A5A5A] pl-3 py-2 truncate">
                        {subCategory}
                      </h3>

                      {/* Services List for this subcategory */}
                      <div className="flex flex-col gap-3 pl-2">
                        {subCategoryServices.map((service) => {
                          const serviceId = service.id || service._id;
                          const cardData = formatServiceForCard(service);
                          return (
                            <div
                              key={serviceId}
                              className="relative group block w-fit"
                            >
                              <div
                                onClick={(e) => handleEditClick(serviceId, e)}
                                className="cursor-pointer [&_a]:pointer-events-none"
                              >
                                <ServiceCard {...cardData} />
                              </div>

                              {/* Action Buttons - Absolute Top Right (Professional Look) */}
                              <div className="absolute top-2 right-2 flex gap-1 z-20">
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={(e) => handleEditClick(serviceId, e)}
                                  className="h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-100 text-gray-600 hover:text-[#EECFD1] hover:bg-white"
                                  title="Edit"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="secondary"
                                  size="icon"
                                  onClick={(e) => handleDeleteClick(serviceId, e)}
                                  className="h-7 w-7 rounded-full bg-white/90 shadow-sm border border-gray-100 text-gray-400 hover:text-red-500 hover:bg-white"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
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

      {/* Pending Services Section - Cleaner Design */}
      {pendingServices.length > 0 && (
        <div className="mt-12 pt-8 border-t border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-[#3A3A3A]">Draft Services</h2>
              <p className="text-sm text-gray-500">Services visible only to you (no time slots set)</p>
            </div>
            <div className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-600">
              {pendingServices.length} Drafts
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {pendingServices.map((service) => {
              const serviceId = service.id || service._id;
              return (
                <div key={serviceId} className="group bg-white border border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-between hover:border-gray-400 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                      <Pencil className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-700 truncate">{service.serviceName || service.subCategory}</h3>
                      <p className="text-sm text-gray-500">{service.category}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => handleEditClick(serviceId, e)}
                    className="text-[#3A3A3A] border-gray-200 hover:bg-gray-50"
                  >
                    Finish Setup
                  </Button>
                </div>
              );
            })}
          </div>
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
      <ServiceEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        serviceId={editingServiceId}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
