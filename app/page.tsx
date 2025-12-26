import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceCarousel } from "@/components/ui/service-carousel";
import { getAllCategories } from "@/lib/constants/categories";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

// Get all category names for homepage display
const SERVICE_CATEGORIES = getAllCategories().map(cat => cat.name);

interface Service {
  id: string;
  _id?: string;
  serviceName: string;
  category: string;
  subCategory?: string;
  businessId: any;
  timeSlots?: Array<{
    date: string | Date;
    startTime: string;
    endTime: string;
    price: number;
    duration: number;
    isBooked?: boolean;
  }>;
}

// Server-side data fetching function
async function fetchCategoryServices(category: string): Promise<{ services: Service[], total: number }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/services?category=${encodeURIComponent(category)}&status=listed&limit=12`,
      {
        next: { revalidate: 60 }, // Cache for 60 seconds
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[Homepage Server] ${category} - API error:`, response.status);
      return { services: [], total: 0 };
    }

    const data = await response.json();
    const services = data.services || [];
    let total = data.pagination?.total || services.length || 0;

    // FIX: If we received fewer services than the limit (12), it means we've reached the end
    // of the available services (after filtering), regardless of what the initial DB count says.
    // Override total to match actual services so "See More" doesn't appear incorrectly.
    if (services.length < 12) {
      total = services.length;
    }

    return {
      services,
      total,
    };
  } catch (error) {
    console.error(`[Homepage Server] Error fetching ${category}:`, error);
    return { services: [], total: 0 };
  }
}

//Helper functions (moved from client)
function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, "0")} ${period.toLowerCase()}`;
}

function getEarliestAvailableTimeSlot(service: Service) {
  if (!service.timeSlots || service.timeSlots.length === 0) {
    return null;
  }

  const now = new Date();

  const availableSlots = service.timeSlots
    .filter((slot) => {
      if (slot.isBooked) return false;

      const slotDate = typeof slot.date === 'string' ? new Date(slot.date) : new Date(slot.date);
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
    .sort((a, b) => {
      const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date);
      const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date);

      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }

      const [hoursA, minsA] = a.startTime.split(":").map(Number);
      const [hoursB, minsB] = b.startTime.split(":").map(Number);
      const timeA = hoursA * 60 + minsA;
      const timeB = hoursB * 60 + minsB;
      return timeA - timeB;
    });

  if (availableSlots.length === 0) {
    return null;
  }

  const earliestSlot = availableSlots[0];
  const slotDate = typeof earliestSlot.date === 'string' ? new Date(earliestSlot.date) : new Date(earliestSlot.date);

  const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;
  const formattedTime = `${formatTime12Hour(earliestSlot.startTime)} - ${formatTime12Hour(earliestSlot.endTime)}`;

  return {
    date: formattedDate,
    time: formattedTime,
    price: earliestSlot.price
  };
}

function formatServiceForCard(service: Service) {
  const earliestSlot = getEarliestAvailableTimeSlot(service);
  const business = typeof service.businessId === 'object' ? service.businessId : null;

  let duration = "";
  if (earliestSlot && service.timeSlots && service.timeSlots.length > 0) {
    const slot = service.timeSlots.find(s => {
      const slotDate = typeof s.date === 'string' ? new Date(s.date) : new Date(s.date);
      const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;
      return formattedDate === earliestSlot.date;
    });
    if (slot && slot.duration) {
      const hours = Math.floor(slot.duration / 60);
      const mins = slot.duration % 60;
      if (hours > 0 && mins > 0) {
        duration = `${hours}Hr ${mins}mins`;
      } else if (hours > 0) {
        duration = `${hours}Hr`;
      } else {
        duration = `${mins}mins`;
      }
    }
  }

  return {
    id: service.id || service._id || '',
    name: service.serviceName,
    price: earliestSlot?.price ?? 0,
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
export default async function HomePage() {
  // Fetch all categories in parallel
  const categoriesData = await Promise.all(
    SERVICE_CATEGORIES.map(async (category) => ({
      category,
      ...(await fetchCategoryServices(category)),
    }))
  );

  // Convert to object for easier access
  const servicesData: Record<string, Service[]> = {};
  const serviceCounts: Record<string, number> = {};

  categoriesData.forEach(({ category, services, total }) => {
    servicesData[category] = services;
    serviceCounts[category] = total;
  });

  return (
    <PageLayout>
      <div className="bg-white min-h-screen">
        {/* Book Button - Below Nav */}
        <div className="bg-white py-3 sm:py-4">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <div className="flex justify-center">
              <Link
                href="/services"
                className="text-[18px] font-medium text-[#3A3A3A] border-b border-[#3A3A3A] pb-0.5 hover:opacity-70 transition-opacity"
              >
                Book
              </Link>
            </div>
          </div>
        </div>

        {/* Discover Section */}
        <section className="py-4 md:py-8 bg-white">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
            <h1 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-[#3A3A3A] mb-4 sm:mb-5 md:mb-6 text-left">
              Discover
            </h1>

            {SERVICE_CATEGORIES.map((category) => {
              const categoryServices = servicesData[category] || [];
              const totalCount = serviceCounts[category] || 0;

              if (categoryServices.length === 0) return null;

              // Filter services with available time slots
              const filteredServices = categoryServices.filter(
                service => getEarliestAvailableTimeSlot(service) !== null
              );

              if (filteredServices.length === 0) return null;

              return (
                <ServiceCarousel
                  key={category}
                  title={category}
                  totalCount={totalCount}
                  showMoreHref={`/category/${encodeURIComponent(category)}`}
                  category={category}
                >
                  {filteredServices
                    .slice(0, 6)
                    .map((service) => (
                      <div key={service.id || service._id} className="flex-shrink-0">
                        <ServiceCard
                          {...formatServiceForCard(service)}
                        />
                      </div>
                    ))}
                </ServiceCarousel>
              );
            })}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
