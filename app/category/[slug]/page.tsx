import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { getAllCategories } from "@/lib/constants/categories";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
    params: {
        slug: string;
    };
}

// Generate static params for known categories
export async function generateStaticParams() {
    const categories = getAllCategories();
    return categories.map((cat) => ({
        slug: encodeURIComponent(cat.name),
    }));
}

// Server-side data fetching
async function fetchCategoryServices(category: string) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const response = await fetch(
            `${baseUrl}/api/services?category=${encodeURIComponent(category)}&status=listed`,
            {
                next: { revalidate: 60 },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            console.error('[Category Server] API error:', response.status);
            return [];
        }

        const data = await response.json();
        return data.services || [];
    } catch (error) {
        console.error('[Category Server] Error fetching services:', error);
        return [];
    }
}

// Helper functions
function formatTime12Hour(time24: string): string {
    if (!time24) return "";
    const [hours, minutes] = time24.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${hours12}:${String(minutes).padStart(2, "0")} ${period.toLowerCase()}`;
}

function getEarliestAvailableTimeSlot(service: any) {
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
}

function formatServiceForCard(service: any) {
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
        id: service.id || service._id,
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
}

// Main Server Component
export default async function CategoryPage({ params }: PageProps) {
    const category = decodeURIComponent(params.slug);

    // Fetch services server-side
    const allServices = await fetchCategoryServices(category);

    // Filter services with available slots
    const services = allServices.filter(
        (service: any) => getEarliestAvailableTimeSlot(service) !== null
    );

    // Group services by subcategory
    const servicesBySubcategory = services.reduce((acc: Record<string, any[]>, service: any) => {
        const subCat = service.subCategory || "Other";
        if (!acc[subCat]) {
            acc[subCat] = [];
        }
        acc[subCat].push(service);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <PageLayout>
            <div className="bg-white min-h-screen py-8 md:py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Category Title */}
                    <div className="flex items-center justify-center mb-8 md:mb-12">
                        <h1 className="text-2xl md:text-3xl font-bold text-[#3A3A3A]">
                            {category}
                        </h1>
                    </div>

                    {services.length === 0 ? (
                        <div className="text-center py-12 text-gray-500">
                            No services available in this category.
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {(Object.entries(servicesBySubcategory) as [string, any[]][]).map(([subCat, subCatServices]) => (
                                <div key={subCat} className="space-y-6">
                                    {/* Subcategory Title */}
                                    <h2 className="text-xl md:text-2xl font-bold text-[#3A3A3A] border-b border-gray-100 pb-2">
                                        {subCat}
                                    </h2>

                                    {/* Services List (Vertical) */}
                                    <div className="flex flex-col space-y-4">
                                        {subCatServices.map((service) => (
                                            <div key={service.id || service._id} className="w-full">
                                                <ServiceCard
                                                    {...formatServiceForCard(service)}
                                                />
                                            </div>
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

// Generate metadata
export function generateMetadata({ params }: PageProps) {
    const category = decodeURIComponent(params.slug);
    return {
        title: `${category} Services | ouiimi`,
        description: `Browse and book ${category.toLowerCase()} services on ouiimi`,
    };
}
