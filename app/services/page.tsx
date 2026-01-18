import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { ServiceFilters } from "@/components/services/ServiceFilters";
import { renderAddress } from "@/lib/utils";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

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

interface PageProps {
  searchParams: {
    category?: string;
    subCategory?: string;
    date?: string;
    latitude?: string;
    longitude?: string;
  };
}

// Server-side data fetching
async function fetchServices(
  category?: string,
  subCategory?: string,
  date?: string,
  latitude?: string,
  longitude?: string
): Promise<Service[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    let url = `${baseUrl}/api/services?status=listed`;

    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (subCategory && subCategory.trim() !== "")
      url += `&subCategory=${encodeURIComponent(subCategory)}`;
    if (date) url += `&date=${encodeURIComponent(date)}`;
    if (latitude && longitude) {
      url += `&latitude=${latitude}&longitude=${longitude}&radius=15`;
    }

    const response = await fetch(url, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Services Server] API error:', response.status);
      return [];
    }

    const data = await response.json();
    return data.services || [];
  } catch (error) {
    console.error('[Services Server] Error fetching services:', error);
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

function getEarliestAvailableTimeSlot(service: Service, filterDate?: string) {
  if (!service.timeSlots || service.timeSlots.length === 0) {
    return null;
  }

  const now = new Date();
  const selectedDate = filterDate ? new Date(filterDate) : null;

  const availableSlots = service.timeSlots
    .filter((slot) => {
      if (slot.isBooked) return false;

      const slotDate = typeof slot.date === 'string' ? new Date(slot.date) : new Date(slot.date);
      const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
      const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Filter by date if specified
      if (selectedDate) {
        const filterDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
        if (slotDateOnly.getTime() !== filterDateOnly.getTime()) {
          return false;
        }
      }

      // Check if slot is in the future
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
      return (hoursA * 60 + minsA) - (hoursB * 60 + minsB);
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
    price: earliestSlot.price,
    duration: earliestSlot.duration
  };
}

function formatServiceForCard(service: Service, filterDate?: string) {
  const earliestSlot = getEarliestAvailableTimeSlot(service, filterDate);
  const business = typeof service.businessId === 'object' ? service.businessId : null;

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
    id: service.id || service._id || '',
    name: service.serviceName,
    price: earliestSlot?.price || 0,
    image: business?.logo || "/placeholder-logo.png",
    category: service.category,
    subCategory: service.subCategory,
    businessName: business?.businessName || "Business",
    location: renderAddress(business?.address) || "",
    duration: duration,
    date: earliestSlot?.date || null,
    time: earliestSlot?.time || null,
  };
}

// Main Server Component
export default async function ServicesPage({ searchParams }: PageProps) {
  const category = searchParams.category || "Hair Services";
  const subCategory = searchParams.subCategory || "";
  const date = searchParams.date || "";
  const latitude = searchParams.latitude;
  const longitude = searchParams.longitude;

  // Fetch services server-side
  const services = await fetchServices(category, subCategory, date, latitude, longitude);

  // Filter services with available slots
  const filteredServices = services.filter(
    service => getEarliestAvailableTimeSlot(service, date) !== null
  );

  return (
    <PageLayout>
      <div className="bg-white min-h-screen pb-20">
        <div className="container mx-auto px-4 max-w-md md:max-w-7xl pt-6">
          {/* Filter Section - Client Component */}
          <ServiceFilters
            initialCategory={category}
            initialSubCategory={subCategory}
            initialDate={date}
            initialLatitude={latitude}
            initialLongitude={longitude}
          />

          {/* Services List - Server Rendered */}
          {filteredServices.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No services found for this category.
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredServices.map((service) => (
                <div key={service.id || service._id} className="w-full">
                  <ServiceCard {...formatServiceForCard(service, date)} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
