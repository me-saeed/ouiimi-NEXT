"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { Search } from "lucide-react";
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

    const { control } = useForm({
        defaultValues: {
            location: "",
        },
    });

    const updateURL = (newCategory?: string, newSubCategory?: string, newDate?: string) => {
        const params = new URLSearchParams();
        const cat = newCategory ?? category;
        const sub = newSubCategory ?? subCategory;
        const date = newDate ?? selectedDate;

        if (cat) params.set("category", cat);
        if (sub && sub !== "") params.set("subCategory", sub);
        if (date) params.set("date", date);

        router.push(`/services?${params.toString()}`);
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
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <AddressAutocomplete
                        control={control}
                        name="location"
                        placeholder="Location"
                        onSelect={(address, coordinates) => {
                            if (coordinates) {
                                setUserLocation({ lat: coordinates.lat, lng: coordinates.lng });
                            }
                        }}
                        className="h-12"
                    />
                </div>
                <div className="relative">
                    <Input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => handleDateChange(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="h-12 px-4 rounded-xl border-gray-200 bg-white text-base text-[#3A3A3A] font-medium"
                    />
                </div>
            </div>

            {/* Row 2: Category Dropdown & Search */}
            <div className="flex gap-3 items-center">
                <div className="flex-1">
                    <Select value={category} onValueChange={handleCategoryChange}>
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
                <button
                    onClick={() => handleSubCategoryChange("")}
                    className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all ${subCategory === ""
                            ? "bg-[#3A3A3A] text-white"
                            : "bg-transparent text-[#888888] hover:text-[#3A3A3A]"
                        }`}
                >
                    All
                </button>

                {SUB_CATEGORIES[category]?.map((sub) => (
                    <button
                        key={sub}
                        onClick={() => handleSubCategoryChange(sub)}
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
    );
}
