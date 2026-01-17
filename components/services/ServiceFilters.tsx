"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Search, Calendar } from "lucide-react";
import { geocodeByAddress, getLatLng } from "react-google-places-autocomplete";
import { DatePickerModal } from "@/components/ui/DatePickerModal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { getAllCategories } from "@/lib/constants/categories";

const SERVICE_CATEGORIES = getAllCategories().map(cat => cat.name);

const SUB_CATEGORIES: Record<string, string[]> = {};
getAllCategories().forEach(category => {
    const subs = category.subcategories.map(sub => sub.name);
    SUB_CATEGORIES[category.name] = subs;
});

interface ServiceFiltersProps {
    initialCategory?: string;
    initialSubCategory?: string;
    initialDate?: string;
}

export function ServiceFilters({
    initialCategory = "Hair Services",
    initialSubCategory = "",
    initialDate = "",
}: ServiceFiltersProps) {
    const router = useRouter();
    const [category, setCategory] = useState(initialCategory);
    const [subCategory, setSubCategory] = useState(initialSubCategory);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    const { control, getValues } = useForm({
        defaultValues: {
            location: "",
        },
    });

    const updateURL = (newCategory?: string, newSubCategory?: string, newDate?: string, newLat?: number, newLng?: number, clearLocation: boolean = false) => {
        const params = new URLSearchParams();
        const cat = newCategory ?? category;
        const sub = newSubCategory ?? subCategory;
        const date = newDate ?? selectedDate;

        // Determine location to use
        let lat, lng;

        if (clearLocation) {
            lat = undefined;
            lng = undefined;
        } else {
            lat = newLat !== undefined ? newLat : (userLocation?.lat);
            lng = newLng !== undefined ? newLng : (userLocation?.lng);
        }

        if (cat) params.set("category", cat);
        if (sub && sub !== "") params.set("subCategory", sub);
        if (date) params.set("date", date);
        if (lat !== undefined) params.set("latitude", String(lat));
        if (lng !== undefined) params.set("longitude", String(lng));

        router.push(`/services?${params.toString()}`);
    };

    const handleManualSearch = async () => {
        const locationText = getValues("location");

        if (!locationText) {
            // If empty, clear location search
            setUserLocation(null);
            updateURL(category, subCategory, selectedDate, undefined, undefined, true);
            return;
        }

        try {
            // Geocode the manually typed address
            const results = await geocodeByAddress(locationText);
            const coordinates = await getLatLng(results[0]);

            setUserLocation({ lat: coordinates.lat, lng: coordinates.lng });
            updateURL(category, subCategory, selectedDate, coordinates.lat, coordinates.lng);
        } catch (error) {
            console.error("Manual search geocoding failed:", error);
            // Optionally handle error (e.g. show toast)
            // For now, if geocoding fails, we just don't update location params
        }
    };

    const handleCategoryChange = (value: string) => {
        setCategory(value);
        setSubCategory(""); // Reset subcategory when category changes
        updateURL(value, "", selectedDate);
    };

    const handleSubCategoryChange = (value: string) => {
        setSubCategory(value);
        updateURL(category, value, selectedDate);
    };

    const handleDateChange = (value: string) => {
        setSelectedDate(value);
        updateURL(category, subCategory, value);
    };

    return (
        <div className="space-y-4 mb-8">
            {/* Row 1: Location & Date */}
            <div className="flex gap-2 md:gap-3">
                <div className="relative flex-1">
                    <AddressAutocomplete
                        control={control}
                        name="location"
                        placeholder="Location"
                        onSelect={(address, coordinates) => {
                            if (coordinates) {
                                setUserLocation({ lat: coordinates.lat, lng: coordinates.lng });
                                updateURL(category, subCategory, selectedDate, coordinates.lat, coordinates.lng);
                            } else {
                                // Handle clear action (coordinates is undefined/null)
                                setUserLocation(null);
                                updateURL(category, subCategory, selectedDate, undefined, undefined, true);
                            }
                        }}
                        className="h-10 md:h-12 text-sm md:text-base"
                    />
                </div>
                <div className="relative min-w-[140px] w-[140px] md:w-auto">
                    {/* Custom Date Picker Button - Works across all devices */}
                    <button
                        type="button"
                        onClick={() => setShowDatePicker(true)}
                        className="h-10 md:h-12 w-full px-3 md:px-4 rounded-xl border border-gray-200 bg-white text-sm md:text-base text-[#3A3A3A] font-medium flex items-center justify-between gap-2 hover:border-[#EECFD1] transition-colors"
                    >
                        <span className={selectedDate ? "text-[#3A3A3A]" : "text-gray-400"}>
                            {selectedDate
                                ? new Date(selectedDate).toLocaleDateString('en-AU', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: '2-digit'
                                })
                                : "Date"}
                        </span>
                        <Calendar className="w-4 h-4 text-gray-400" />
                    </button>

                    {/* Date Picker Modal */}
                    <DatePickerModal
                        isOpen={showDatePicker}
                        onClose={() => setShowDatePicker(false)}
                        onSelectDate={(date) => {
                            handleDateChange(date);
                            setShowDatePicker(false);
                        }}
                        minDate={new Date()}
                    />
                </div>
            </div>

            {/* Row 2: Category Dropdown & Search */}
            <div className="flex gap-2 md:gap-3 items-center">
                <div className="flex-1">
                    <Select value={category} onValueChange={handleCategoryChange}>
                        <SelectTrigger className="h-10 md:h-12 rounded-xl border-gray-200 bg-white text-sm md:text-base font-medium text-[#3A3A3A]">
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
                <Button
                    size="icon"
                    variant="ghost"
                    className="h-10 w-10 md:h-12 md:w-12 rounded-full hover:bg-gray-100"
                    onClick={handleManualSearch}
                >
                    <Search className="h-5 w-5 md:h-6 md:w-6 text-[#3A3A3A]" />
                </Button>
            </div>

            {/* Row 3: Sub-categories (Horizontal Scroll) */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 -mx-4 px-4 md:mx-0 md:px-0">
                <button
                    onClick={() => handleSubCategoryChange("")}
                    className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium transition-all ${subCategory === ""
                        ? "text-[#3A3A3A] border-b-2 border-[#3A3A3A]"
                        : "text-[#888888] hover:text-[#3A3A3A]"
                        }`}
                >
                    All
                </button>

                {SUB_CATEGORIES[category]?.map((sub) => (
                    <button
                        key={sub}
                        onClick={() => handleSubCategoryChange(sub)}
                        className={`whitespace-nowrap px-3 md:px-4 py-1.5 md:py-2 text-sm font-medium transition-all ${sub === subCategory
                            ? "text-[#3A3A3A] border-b-2 border-[#3A3A3A]"
                            : "text-[#888888] hover:text-[#3A3A3A]"
                            }`}
                    >
                        {sub}
                    </button>
                ))}
            </div>
        </div>
    );
}
