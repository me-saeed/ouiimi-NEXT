"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Services</h1>
              <p className="text-muted-foreground">Manage your service listings</p>
            </div>
            <Link
              href="/business/services/create"
              className="btn-polished btn-polished-primary px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Add Service
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
            </div>
          ) : services.length === 0 ? (
            <div className="card-polished p-12 text-center max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-[#3A3A3A] font-semibold mb-2 text-lg">No services yet</p>
              <p className="text-[#3A3A3A]/70 text-sm mb-6">Get started by creating your first service</p>
              <Link
                href="/business/services/create"
                className="btn-polished btn-polished-primary inline-block"
              >
                Create Your First Service
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const serviceId = service.id || service._id;
                return (
                  <div
                    key={serviceId}
                    className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2">
                        {service.serviceName}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {service.category}
                        </span>
                        {service.subCategory && (
                          <span className="px-3 py-1 bg-muted text-muted-foreground rounded-full text-xs">
                            {service.subCategory}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-3xl font-bold text-foreground">
                        ${service.baseCost?.toFixed(2) || "0.00"}
                      </p>
                      {service.duration && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.duration}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex gap-3 pt-4 border-t border-border/50">
                      <Link
                        href={`/business/services/${serviceId}/edit`}
                        className="flex-1 btn-polished btn-polished-primary text-center text-sm py-2.5 rounded-xl font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(serviceId)}
                        className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                      >
                        Delete
                      </button>
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

