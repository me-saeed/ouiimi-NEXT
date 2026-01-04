import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceCarousel } from "@/components/ui/service-carousel";
import { getAllCategories } from "@/lib/constants/categories";

// Enable ISR - revalidate every 5 seconds (Near Real-time)
export const revalidate = 5;

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
interface CategoryData {
  items: Service[];
  hasMore: boolean;
}

async function fetchFeaturedServices(): Promise<Record<string, CategoryData>> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(
      `${baseUrl}/api/services/featured`,
      {
        next: { revalidate: 5 }, // Cache for 5 seconds
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`[Homepage Server] API error:`, response.status);
      return {};
    }

    const data = await response.json();
    return data.services || {};
  } catch (error) {
    console.error(`[Homepage Server] Error fetching featured services:`, error);
    return {};
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

  // Pre-filtered by server, but checking implementation
  const validSlots = service.timeSlots;

  if (validSlots.length === 0) {
    return null;
  }

  // Sort locally just in case, though server filtering implies some order or raw
  // We want the absolute earliest
  const sortedSlots = [...validSlots].sort((a, b) => {
    const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date);
    const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date);

    const timeA = dateA.getTime();
    const timeB = dateB.getTime();

    if (timeA !== timeB) return timeA - timeB;

    const [hA, mA] = a.startTime.split(":").map(Number);
    const [hB, mB] = b.startTime.split(":").map(Number);
    return (hA * 60 + mA) - (hB * 60 + mB);
  });

  const earliestSlot = sortedSlots[0];
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
    // Find the slot object corresponding to earliestSlot
    // Simpler matching since we know it came from the array
    const slot = service.timeSlots.find(s => {
      const d = typeof s.date === 'string' ? new Date(s.date) : new Date(s.date);
      const fDate = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getFullYear()).slice(-2)}`;
      // Basic match on date/time/price to find correct duration
      const fTime = `${formatTime12Hour(s.startTime)} - ${formatTime12Hour(s.endTime)}`;
      return fDate === earliestSlot.date && fTime === earliestSlot.time;
    }) || service.timeSlots[0]; // Fallback

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
  // FAST: Single fetch for all categories
  const servicesData = await fetchFeaturedServices();

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
              const categoryData = servicesData[category] || { items: [], hasMore: false };
              const categoryServices = categoryData.items || [];
              const hasMore = categoryData.hasMore || false;

              // DOUBLE CHECK: Filter locally as well to ensure getEarliestAvailableTimeSlot returns a valid value.
              // This acts as a safety layer so we never show cards with "null" dates if server/client time differs slightly.
              const filteredServices = categoryServices.filter(
                service => getEarliestAvailableTimeSlot(service) !== null
              );

              if (filteredServices.length === 0) return null;

              return (
                <ServiceCarousel
                  key={category}
                  title={category}
                  totalCount={hasMore ? 7 : filteredServices.length} // Show 7+ if hasMore, else actual count
                  showMoreHref={hasMore ? `/category/${encodeURIComponent(category)}` : undefined} // Only show link if more exist
                  category={category}
                >
                  {filteredServices.map((service) => (
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
