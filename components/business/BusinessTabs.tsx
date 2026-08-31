"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ServiceCard } from "@/components/ui/service-card";
import { StaffCard } from "@/components/ui/staff-card";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import { StaffDetailsModal } from "./StaffDetailsModal";
import { Calendar } from "lucide-react";

interface BusinessTabsProps {
    business: any;
    services: any[];
    staff: any[];
}

export function BusinessTabs({ business, services, staff }: BusinessTabsProps) {
    const [activeTab, setActiveTab] = useState<"story" | "services" | "staff">("services");
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<any>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const getFilteredServices = () => {
        let filtered = services;

        if (selectedDate) {
            filtered = filtered.filter((service) => {
                return service.timeSlots?.some((slot: any) => {
                    const slotDate = new Date(slot.date);
                    return slotDate.toDateString() === selectedDate.toDateString();
                });
            });
        }

        return filtered;
    };

    const groupServicesByCategory = (services: any[]) => {
        // First level: group by category
        const byCategory: Record<string, any[]> = {};
        services.forEach((service) => {
            const cat = service.category || "Other";
            if (!byCategory[cat]) {
                byCategory[cat] = [];
            }
            byCategory[cat].push(service);
        });

        // Second level: within each category, group by subCategory
        const result: Record<string, Record<string, any[]>> = {};
        Object.entries(byCategory).forEach(([category, catServices]) => {
            result[category] = {};
            catServices.forEach((service) => {
                const sub = service.subCategory || "Other";
                if (!result[category][sub]) {
                    result[category][sub] = [];
                }
                result[category][sub].push(service);
            });
        });

        return result;
    };

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
        const serviceBusiness = typeof service.businessId === 'object' ? service.businessId : business;

        // Get duration from service root or first time slot
        let duration = service.duration;
        if (!duration && service.timeSlots && service.timeSlots.length > 0) {
            duration = service.timeSlots[0].duration;
        }

        // Format duration string (e.g., "30" -> "30 mins")
        const formattedDuration = duration ? (typeof duration === 'number' ? `${duration} mins` : duration) : "";

        return {
            id: service.id || service._id,
            name: service.serviceName,
            price: service.timeSlots && service.timeSlots.length > 0 ? (service.timeSlots[0]?.price || 0) : 0,
            image: business?.logo || "/placeholder-logo.png",
            category: service.category,
            subCategory: service.subCategory,
            businessName: serviceBusiness?.businessName || "Business",
            location: serviceBusiness?.address || "",
            duration: formattedDuration,
            date: date,
            time: time,
        };
    };

    const filteredServices = getFilteredServices();
    const groupedByCategory = groupServicesByCategory(filteredServices);

    return (
        <>
            {/* Navigation Tabs */}
            <div className="bg-white border-b border-border/50 sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center w-full max-w-3xl mx-auto">
                        <button
                            onClick={() => setActiveTab("story")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "story"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Story
                            {activeTab === "story" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("services")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "services"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Services
                            {activeTab === "services" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("staff")}
                            className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "staff"
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            Staff
                            {activeTab === "staff" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Tab Content */}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {activeTab === "story" && (
                    <div className="max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            {/* Story Section */}
                            <div className="p-8 md:p-12">
                                <h2 className="text-3xl font-bold text-[#3A3A3A] mb-6">Our Story</h2>
                                {business.story ? (
                                    <div className="prose prose-lg max-w-none">
                                        <p className="text-gray-700 leading-relaxed text-base whitespace-pre-line">
                                            {business.story}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="text-center py-12">
                                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                                            <svg className="w-8 h8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-gray-500 text-sm">No story available yet.</p>
                                    </div>
                                )}
                            </div>

                            {/* Contact Information Section */}
                            <div className="border-t border-gray-100 bg-gray-50/50 p-8 md:p-12">
                                <h3 className="text-xl font-semibold text-[#3A3A3A] mb-6">Contact Information</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {business.address && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#EECFD1]/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-[#EECFD1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</p>
                                                <p className="text-gray-700 text-sm leading-relaxed">{business.address}</p>
                                            </div>
                                        </div>
                                    )}

                                    {business.email && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#EECFD1]/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-[#EECFD1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</p>
                                                <a href={`mailto:${business.email}`} className="text-gray-700 text-sm hover:text-[#EECFD1] transition-colors">
                                                    {business.email}
                                                </a>
                                            </div>
                                        </div>
                                    )}

                                    {business.phone && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-[#EECFD1]/20 flex items-center justify-center flex-shrink-0">
                                                <svg className="w-5 h-5 text-[#EECFD1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</p>
                                                <a href={`tel:${business.phone}`} className="text-gray-700 text-sm hover:text-[#EECFD1] transition-colors">
                                                    {business.phone}
                                                </a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === "services" && (
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-semibold">Services</h2>
                            <div className="flex items-center gap-2">
                                <div className="relative min-w-[140px] w-[140px]">
                                    {/* Custom Date Picker Button - Works across all devices */}
                                    <button
                                        type="button"
                                        onClick={() => setShowDatePicker(true)}
                                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white flex items-center justify-between gap-2 hover:border-[#EECFD1] transition-colors"
                                    >
                                        <span className={selectedDate ? "text-[#3A3A3A]" : "text-gray-400"}>
                                            {selectedDate
                                                ? selectedDate.toLocaleDateString('en-AU', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: '2-digit'
                                                })
                                                : "Select Date"}
                                        </span>
                                        <Calendar className="w-4 h-4 text-gray-400" />
                                    </button>

                                    {/* Date Picker Modal */}
                                    <DatePickerModal
                                        isOpen={showDatePicker}
                                        onClose={() => setShowDatePicker(false)}
                                        onSelectDate={(dateStr) => {
                                            setSelectedDate(new Date(dateStr));
                                            setShowDatePicker(false);
                                        }}
                                        minDate={new Date()}
                                    />
                                </div>
                                {selectedDate && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedDate(null)}
                                    >
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </div>

                        {filteredServices.length === 0 ? (
                            <div className="text-center py-12 card-polished">
                                <p className="text-muted-foreground">
                                    {selectedDate ? "No services available on this date." : "No services listed yet."}
                                </p>
                            </div>
                        ) : (
                            Object.entries(groupedByCategory).map(([category, subCategories]) => (
                                <div key={category} className="space-y-6 pb-8 border-b-2 border-gray-100 last:border-b-0">
                                    {/* Category Header */}
                                    <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A]">{category}</h2>

                                    {/* Subcategories within this category */}
                                    {Object.entries(subCategories).map(([subCategory, subServices]) => (
                                        <div key={subCategory} className="space-y-3 pl-4">
                                            {/* Subcategory Header */}
                                            {subCategory !== "Other" && (
                                                <h3 className="text-base font-semibold text-gray-600">{subCategory}</h3>
                                            )}

                                            {/* Services Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                                                {subServices.map((service) => (
                                                    <ServiceCard
                                                        key={service.id || service._id}
                                                        {...formatServiceForCard(service)}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                )}

                {activeTab === "staff" && (
                    <div className="max-w-3xl mx-auto">
                        <div className="space-y-2">
                            {staff.length === 0 ? (
                                <div className="col-span-full text-center py-12">
                                    <p className="text-muted-foreground">No staff listed yet.</p>
                                </div>
                            ) : (
                                staff.map((member) => (
                                    <button
                                        key={member.id || member._id}
                                        onClick={() => setSelectedStaff(member)}
                                        className="flex items-center gap-4 w-full p-4 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer group relative text-left"
                                    >
                                        {/* Avatar */}
                                        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#EECFD1] flex items-center justify-center flex-shrink-0">
                                            {member.photo ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img src={member.photo} alt={member.name} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-lg font-bold text-[#3A3A3A]">
                                                    {member.name?.charAt(0)?.toUpperCase() || "S"}
                                                </span>
                                            )}
                                        </div>

                                        {/* Name - No qualifications list in this view to match dashboard */}
                                        <div className="flex-1">
                                            <h3 className="text-sm md:text-base font-semibold text-[#3A3A3A] group-hover:text-black transition-colors">{member.name}</h3>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Staff Details Modal */}
                        <StaffDetailsModal
                            isOpen={!!selectedStaff}
                            onClose={() => setSelectedStaff(null)}
                            staff={selectedStaff}
                        />
                    </div>
                )}
            </div>
        </>
    );
}
