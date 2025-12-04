"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceCard } from "@/components/ui/service-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

  // State for filters
  const [category, setCategory] = useState(searchParams.get("category") || "Hair Services");
  const [subCategory, setSubCategory] = useState(searchParams.get("subCategory") || "All");
  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");

  const [services, setServices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (subCategory && subCategory !== "All") params.set("subCategory", subCategory);
    router.push(`/services?${params.toString()}`, { scroll: false });

    loadServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, subCategory]);

  const loadServices = async () => {
    setIsLoading(true);
    try {
      let url = "/api/services?status=listed";
      if (category) url += `&category=${encodeURIComponent(category)}`;
      // Note: API might need update to support subCategory filtering if not already

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

  const formatServiceForCard = (service: any) => {
    // Helper to format service data for card
    // ... (reuse logic from HomePage or move to utility)
    const business = typeof service.businessId === 'object' ? service.businessId : null;
    return {
      id: service.id,
      name: service.serviceName,
      price: service.baseCost,
      image: business?.logo || "/placeholder-logo.png",
      category: service.category,
      subCategory: service.subCategory,
      businessName: business?.businessName || "Business",
      location: business?.address || "",
      duration: service.duration,
      date: "06.06.26", // Mock date as per image
      time: "10:00 am - 12:00pm", // Mock time as per image
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
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-3 h-12 rounded-xl border-gray-200 bg-white text-base"
              />
            </div>
            <Button
              variant="outline"
              className="h-12 px-6 rounded-xl border-gray-200 text-[#3A3A3A] font-medium bg-white hover:bg-gray-50"
            >
              Date
            </Button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {services.map((service) => (
              <ServiceCard
                key={service.id}
                {...formatServiceForCard(service)}
              />
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

