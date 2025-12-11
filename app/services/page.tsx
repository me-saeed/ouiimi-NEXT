"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Search, Calendar, MapPin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/contexts/AuthContext";

const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Dog Grooming",
];

// Mock sub-categories for demonstration - in real app, fetch from API
const SUB_CATEGORIES: Record<string, string[]> = {
  "Hair Services": ["Haircut", "Colouring", "Blow-Dry & Styling", "Treatment", "Extensions"],
  "Nails": ["Manicure", "Pedicure", "Gel", "Acrylic", "Nail Art"],
  "Beauty & Brows": ["Brows", "Lashes", "Makeup", "Facial", "Waxing"],
  "Massage & Wellness": ["Massage", "Spa", "Sauna", "Physio", "Chiro"],
  "Dog Grooming": ["Wash", "Cut", "Nails", "Full Groom", "Puppy Groom"],
};

function ServicesContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  // State for filters
  const [category, setCategory] = useState(searchParams.get("category") || "Hair Services");
  const [subCategory, setSubCategory] = useState(searchParams.get("subCategory") || "All");
  const [selectedDate, setSelectedDate] = useState(searchParams.get("date") || "");
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationAddress, setLocationAddress] = useState("");

  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { control, watch, setValue } = useForm({
    defaultValues: {
      location: "",
    },
  });

  const locationValue = watch("location");

  // Get user's current location or account location
  useEffect(() => {
    const getLocation = async () => {
      // Priority 1: Try to get current location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          async () => {
            // If denied, try user account location (Priority 2)
            if (user && (user as any).address) {
              try {
                // Geocode user account address
                const { geocodeByAddress, getLatLng } = await import("react-google-places-autocomplete");
                const userAddress = (user as any).address;
                const results = await geocodeByAddress(userAddress);
                const coordinates = await getLatLng(results[0]);
                setUserLocation({
                  lat: coordinates.lat,
                  lng: coordinates.lng,
                });
                setLocationAddress(userAddress);
                setValue("location", userAddress);
              } catch (err) {
                console.error("Error geocoding user address:", err);
                setUserLocation(null);
              }
            } else {
              // Priority 3: Manual input (already handled by AddressAutocomplete)
              setUserLocation(null);
            }
          }
        );
      } else {
        // Fallback to user account location or manual input
        if (user && (user as any).address) {
          try {
            const { geocodeByAddress, getLatLng } = await import("react-google-places-autocomplete");
            const userAddress = (user as any).address;
            const results = await geocodeByAddress(userAddress);
            const coordinates = await getLatLng(results[0]);
            setUserLocation({
              lat: coordinates.lat,
              lng: coordinates.lng,
            });
            setLocationAddress(userAddress);
            setValue("location", userAddress);
          } catch (err) {
            console.error("Error geocoding user address:", err);
            setUserLocation(null);
          }
        }
      }
    };

    getLocation();
  }, [user, setValue]);

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subCategory && subCategory !== "All") params.set("subCategory", subCategory);
    if (selectedDate) params.set("date", selectedDate);
    router.push(`/services?${params.toString()}`, { scroll: false });

    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory, selectedDate, userLocation, locationAddress]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      let url = "/api/services?status=listed";
      if (category) url += `&category=${encodeURIComponent(category)}`;
      if (selectedDate) url += `&date=${encodeURIComponent(selectedDate)}`;

      // Add location parameters for geospatial query
      if (userLocation) {
        url += `&latitude=${userLocation.lat}&longitude=${userLocation.lng}&radius=15`;
      } else if (locationValue && typeof locationValue === 'string' && locationValue.trim()) {
        // If manual location is entered, geocode it first
        try {
          const { geocodeByAddress, getLatLng } = await import("react-google-places-autocomplete");
          const results = await geocodeByAddress(locationValue);
          const coordinates = await getLatLng(results[0]);
          setUserLocation({ lat: coordinates.lat, lng: coordinates.lng });
          url += `&latitude=${coordinates.lat}&longitude=${coordinates.lng}&radius=15`;
        } catch (err) {
          console.error("Error geocoding location:", err);
          // Continue without location filter if geocoding fails
        }
      }

      const response = await fetch(url);
      const data = await response.json();

      let filteredServices = data.services || [];

      // Client-side filtering for sub-category if API doesn't support it yet
      if (subCategory && subCategory !== "All") {
        filteredServices = filteredServices.filter((s: any) =>
          s.subCategory === subCategory || s.serviceName.toLowerCase().includes(subCategory.toLowerCase())
        );
      }

      setServices(filteredServices);
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format time to 12-hour AM/PM format
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
    const filterDate = selectedDate ? new Date(selectedDate) : null;

    // Find all available (not booked) future slots
    const availableSlots = service.timeSlots
      .filter((slot: any) => {
        if (slot.isBooked) return false;

        const slotDate = typeof slot.date === 'string' ? new Date(slot.date) : new Date(slot.date);
        const slotDateOnly = new Date(slotDate.getFullYear(), slotDate.getMonth(), slotDate.getDate());
        const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        // If date filter is set, only show slots for that date
        if (filterDate) {
          const filterDateOnly = new Date(filterDate.getFullYear(), filterDate.getMonth(), filterDate.getDate());
          if (slotDateOnly.getTime() !== filterDateOnly.getTime()) {
            return false;
          }
        }

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
        const dateA = typeof a.date === 'string' ? new Date(a.date) : new Date(a.date);
        const dateB = typeof b.date === 'string' ? new Date(b.date) : new Date(b.date);

        // Sort by date first
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }

        // If same date, sort by start time
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

    // Format date as DD.MM.YY (06.06.26)
    const formattedDate = `${String(slotDate.getDate()).padStart(2, "0")}.${String(slotDate.getMonth() + 1).padStart(2, "0")}.${String(slotDate.getFullYear()).slice(-2)}`;

    // Format time as "10:00 am - 12:00pm"
    const formattedTime = `${formatTime12Hour(earliestSlot.startTime)} - ${formatTime12Hour(earliestSlot.endTime)}`;

    return {
      date: formattedDate,
      time: formattedTime,
      price: earliestSlot.price,
      duration: earliestSlot.duration
    };
  };

  const formatServiceForCard = (service: any) => {
    const earliestSlot = getEarliestAvailableTimeSlot(service);
    const business = typeof service.businessId === 'object' ? service.businessId : null;

    // Calculate duration string
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

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="container mx-auto px-4 max-w-md md:max-w-7xl pt-6">

        {/* Filter Section - Matching Uploaded Image */}
        <div className="space-y-4 mb-8">
          {/* Row 1: Location & Date */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <AddressAutocomplete
                control={control}
                name="location"
                placeholder="Location"
                onSelect={(address, coordinates) => {
                  if (coordinates) {
                    setUserLocation({ lat: coordinates.lat, lng: coordinates.lng });
                    setLocationAddress(address);
                  } else {
                    setLocationAddress(address);
                  }
                }}
                className="h-12"
              />
            </div>
            <div className="relative">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="h-12 px-4 rounded-xl border-gray-200 bg-white text-base text-[#3A3A3A] font-medium"
              />
            </div>
          </div>

          {/* Row 2: Category Dropdown & Search */}
          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-12 rounded-xl border-gray-200 bg-white text-base font-medium text-[#3A3A3A]">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="icon" variant="ghost" className="h-12 w-12 rounded-full hover:bg-gray-100">
              <Search className="h-6 w-6 text-[#3A3A3A]" />
            </Button>
          </div>

          {/* Row 3: Sub-categories (Horizontal Scroll) */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0">
            {SUB_CATEGORIES[category]?.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubCategory(sub === subCategory ? "All" : sub)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${sub === subCategory
                  ? "bg-[#3A3A3A] text-white"
                  : "bg-transparent text-[#888888] hover:text-[#3A3A3A]"
                  }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Services List */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No services found for this category.
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            {services
              .filter((service) => {
                // Filter out services with no available future slots
                const earliestSlot = getEarliestAvailableTimeSlot(service);
                return earliestSlot !== null;
              })
              .map((service) => (
                <div key={service.id} className="w-full">
                  <ServiceCard
                    {...formatServiceForCard(service)}
                  />
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <PageLayout>
      <Suspense fallback={<div className="bg-white min-h-screen" />}>
        <ServicesContent />
      </Suspense>
    </PageLayout>
  );
}

