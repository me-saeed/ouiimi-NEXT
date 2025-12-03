"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

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
    <div className="max-w-4xl mx-auto space-y-8">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Listing on ouiimi</h2>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your service listings. These are visible to shoppers on your business page.
          </p>
        </div>
        <Link href="/business/services/create">
          <Button className="btn-polished-primary">Add New Service</Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-12 card-polished">
          <p className="text-muted-foreground mb-4">No services listed yet.</p>
          <Link href="/business/services/create">
            <Button className="btn-polished-primary">Create Your First Service</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category} className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">{category}</h3>
              <div className="grid gap-4">
                {categoryServices.map((service) => (
                  <div
                    key={service.id}
                    className="card-polished p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => router.push(`/business/services/${service.id}/edit`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium">{service.serviceName}</h4>
                        {service.subCategory && (
                          <p className="text-sm text-muted-foreground">{service.subCategory}</p>
                        )}
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>${service.baseCost.toFixed(2)}</span>
                          <span>•</span>
                          <span>{service.duration}</span>
                          {service.timeSlots && service.timeSlots.length > 0 && (
                            <>
                              <span>•</span>
                              <span>{service.timeSlots.length} time slot{service.timeSlots.length !== 1 ? 's' : ''}</span>
                            </>
                          )}
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            service.status === "listed"
                              ? "bg-green-100 text-green-800"
                              : service.status === "booked"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {service.status}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
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
