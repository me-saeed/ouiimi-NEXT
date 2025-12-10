"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function CategoryPage() {
    const searchParams = useSearchParams();
    const category = searchParams.get("category") || "Hair Services";
    const { user } = useAuth();

    const [services, setServices] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        loadCategoryServices();
    }, [category]);

    const loadCategoryServices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/services?category=${encodeURIComponent(category)}&status=listed`
            );
            if (response.ok) {
                const data = await response.json();
                // Filter services with available slots
                const servicesWithSlots = (data.services || []).filter((service: any) => {
                    const earliestSlot = getEarliestAvailableTimeSlot(service);
                    return earliestSlot !== null;
                });
                setServices(servicesWithSlots);
            }
        } catch (error) {
            console.error("Error loading services:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime12Hour = (time24: string): string => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period.toLowerCase()}`;
    };

    const getEarliestAvailableTimeSlot = (service: any) => {
        if (!service.timeSlots || service.timeSlots.length === 0) {
            return null;
        }

        const now = new Date();
        const availableSlots = service.timeSlots
            .filter((slot: any) => {
                if (slot.isBooked) return false;
                const slotDate = new Date(slot.date);
                const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
                const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

                if (slotDateOnly.getTime() === nowDateOnly.getTime()) {
                    const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
                    const slotEndDateTime = new Date(slotDate);
                    slotEndDateTime.setHours(endHours, endMinutes, 0, 0);
                    return slotEndDateTime > now;
                }
                return slotDateOnly > nowDateOnly;
            })
            .sort((a: any, b: any) => {
                const dateA = new Date(a.date);
                const dateB = new Date(b.date);
                if (dateA.getTime() !== dateB.getTime()) {
                    return dateA.getTime() - dateB.getTime();
                }
                const [hoursA, minsA] = a.startTime.split(":").map(Number);
                const [hoursB, minsB] = b.startTime.split(":").map(Number);
                return hoursA * 60 + minsA - (hoursB * 60 + minsB);
            });

        if (availableSlots.length === 0) return null;

        const earliestSlot = availableSlots[0];
        const slotDate = new Date(earliestSlot.date);
        const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;
        const formattedTime = `${formatTime12Hour(earliestSlot.startTime)} - ${formatTime12Hour(earliestSlot.endTime)}`;

        return {
            date: formattedDate,
            time: formattedTime,
            price: earliestSlot.price,
            duration: earliestSlot.duration,
        };
    };

    const formatServiceForCard = (service: any) => {
        const earliestSlot = getEarliestAvailableTimeSlot(service);
        const business = typeof service.businessId === "object" ? service.businessId : null;

        let duration = "";
        if (earliestSlot && earliestSlot.duration) {
            const hours = Math.floor(earliestSlot.duration / 60);
            const mins = earliestSlot.duration % 60;
            if (hours > 0 && mins > 0) {
                duration = `${hours}Hr ${mins}mins`;
            } else if (hours > 0) {
                duration = `${hours}Hr`;
            } else {
                duration = `${mins}mins`;
            }
        }

        return {
            id: service.id,
            name: service.serviceName,
            price: earliestSlot?.price || 0,
            image: business?.logo || "/placeholder-logo.png",
            category: service.category,
            subCategory: service.subCategory,
            businessName: business?.businessName || "Business",
            location: business?.address || "",
            duration: duration,
            date: earliestSlot?.date || null,
            time: earliestSlot?.time || null,
        };
    };

    // Group services by subcategory
    const servicesBySubcategory = services.reduce((acc, service) => {
        const subCat = service.subCategory || "Other";
        if (!acc[subCat]) {
            acc[subCat] = [];
        }
        acc[subCat].push(service);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <PageLayout user={user}>
            <div className="bg-white min-h-screen py-8 md:py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
                    {/* Category Title */}
                    <h1 className="text-2xl md:text-3xl font-bold text-[#3A3A3A] mb-8 text-center">
                        {category}
                    </h1>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
                        </div>
                    ) : services.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No services available in this category.
                        </div>
                    ) : (
                        <div className="space-y-10">
                            {(Object.entries(servicesBySubcategory) as [string, any[]][]).map(([subCat, subCatServices]) => (
                                <div key={subCat} className="space-y-4">
                                    {/* Subcategory Title */}
                                    <h2 className="text-lg md:text-xl font-bold text-[#3A3A3A]">
                                        {subCat}
                                    </h2>

                                    {/* Services for this subcategory */}
                                    <div className="space-y-3">
                                        {subCatServices.map((service) => (
                                            <ServiceCard
                                                key={service.id}
                                                {...formatServiceForCard(service)}
                                            />
                                        ))}
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
