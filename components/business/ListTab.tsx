"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { Plus, Clock, DollarSign, Calendar } from "lucide-react";

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
}

export function ListTab({ business }: ListTabProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

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

  const groupedServices = services.reduce((acc, service) => {
    const category = service.category || "Other";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, Service[]>);

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
              <div className="grid gap-4">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="bg-white rounded-2xl border border-[#F5F5F5] p-5 hover:border-[#EECFD1] hover:shadow-md transition-all cursor-pointer group"
                    onClick={() => router.push(`/business/services/${service.id}/edit`)}
                  >
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <h4 className="font-bold text-[#3A3A3A] text-lg group-hover:text-[#EECFD1] transition-colors">
                            {service.serviceName}
                          </h4>
                          {service.subCategory && (
                            <p className="text-xs text-[#888888] uppercase tracking-wide mt-1">
                              {service.subCategory}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1.5 text-[#888888]">
                            <DollarSign className="w-4 h-4 text-[#EECFD1]" />
                            <span className="font-semibold text-[#3A3A3A]">${service.baseCost.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#888888]">
                            <Clock className="w-4 h-4 text-[#EECFD1]" />
                            <span>{service.duration}</span>
                          </div>
                          {service.timeSlots && service.timeSlots.length > 0 && (
                            <div className="flex items-center gap-1.5 text-[#888888]">
                              <Calendar className="w-4 h-4 text-[#EECFD1]" />
                              <span>{service.timeSlots.length} slot{service.timeSlots.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>

                        {service.description && (
                          <p className="text-sm text-[#888888] line-clamp-2 leading-relaxed">
                            {service.description}
                          </p>
                        )}
                      </div>

                      <div className="flex sm:flex-col items-center gap-3 self-start">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold ${service.status === "listed"
                              ? "bg-green-100 text-green-700"
                              : service.status === "booked"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                        >
                          {service.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-[#EECFD1] text-[#EECFD1] hover:bg-[#EECFD1] hover:text-white rounded-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/business/services/${service.id}/edit`);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
