"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceUpdateSchema, type ServiceUpdateInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { getAllCategories, getAddOnsByCategory } from "@/lib/constants/categories";
import { TimeSelect } from "@/components/ui/time-select";
import { Modal } from "@/components/ui/modal";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Get all category names
const CATEGORIES = getAllCategories().map(cat => cat.name);

// Build subcategories dynamically from constants
const SUB_CATEGORIES: Record<string, string[]> = {};
getAllCategories().forEach(category => {
    const subs = category.subcategories.map(sub => sub.name);
    SUB_CATEGORIES[category.name] = subs.length > 0 ? subs : [];
});

interface EditServiceFormProps {
    serviceId: string;
    onSuccess: () => void;
    onCancel: () => void;
}

export function EditServiceForm({ serviceId, onSuccess, onCancel }: EditServiceFormProps) {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [error, setError] = useState<string>("");
    const [success, setSuccess] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingService, setIsLoadingService] = useState(true);
    const [timeSlotError, setTimeSlotError] = useState<string>("");
    const [service, setService] = useState<any>(null);
    const [business, setBusiness] = useState<any>(null);
    const [staff, setStaff] = useState<any[]>([]);
    // Group time slots by date: { "2025-10-30": [{ startTime, endTime, price, duration, staffIds }] }
    const [datesWithSlots, setDatesWithSlots] = useState<Record<string, Array<{
        startTime: string;
        endTime: string;
        price: number;
        duration: number;
        staffIds: string[];
        addOns: Array<{ name: string; cost: number }>;
    }>>>({});
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [newTimeSlot, setNewTimeSlot] = useState({
        startTime: "",
        endTime: "",
        price: "" as string | number,
        staffIds: [] as string[],
    });

    // Add-ons state
    const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; cost: number }>>([]);
    const [isAddOnsDropdownOpen, setIsAddOnsDropdownOpen] = useState(false);
    // Removed unused manual time state variables

    const {
        register,
        handleSubmit,
        control,
        watch,
        formState: { errors },
        setValue,
        reset, // Added reset
    } = useForm<ServiceUpdateInput>({
        resolver: zodResolver(serviceUpdateSchema),
    });

    const selectedCategory = watch("category");

    useEffect(() => {
        // Load service on mount - auth is handled by session cookies
        loadService();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceId]);

    useEffect(() => {
        // Reset subCategory when category changes
        if (selectedCategory) {
            const currentSubCategory = watch("subCategory");
            // Only reset if current subCategory is not valid for new category
            if (currentSubCategory && SUB_CATEGORIES[selectedCategory] && !SUB_CATEGORIES[selectedCategory].includes(currentSubCategory)) {
                setValue("subCategory", "");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCategory, setValue]);

    const loadService = async () => {
        try {
            const response = await fetch(`/api/services/${serviceId}`, {
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use session cookies
            });

            if (!response.ok) {
                setError("Failed to load service");
                setIsLoadingService(false);
                return;
            }

            const data = await response.json();
            if (data.service) {
                setService(data.service);

                // Prepare address
                let addressValue;
                if (typeof data.service.address === 'object' && data.service.address?.street) {
                    addressValue = data.service.address;
                } else if (typeof data.service.address === 'string') {
                    // Legacy: convert string address to object format
                    addressValue = {
                        street: data.service.address,
                        location: {
                            type: "Point",
                            coordinates: [0, 0],
                        },
                    };
                }

                // Determine subcategory/service name
                const subCategoryValue = data.service.subCategory || data.service.serviceName || "";

                // Initialize form with all values at once
                reset({
                    category: data.service.category,
                    subCategory: subCategoryValue,
                    serviceName: subCategoryValue,
                    description: data.service.description || "",
                    address: addressValue,
                });

                // Group time slots by date
                const grouped: Record<string, Array<{
                    startTime: string;
                    endTime: string;
                    price: number;
                    duration: number;
                    staffIds: string[];
                    addOns: Array<{ name: string; cost: number }>;
                }>> = {};

                // Calculate duration helper
                const calculateDuration = (startTime: string, endTime: string): number => {
                    const [startHours, startMinutes] = startTime.split(":").map(Number);
                    const [endHours, endMinutes] = endTime.split(":").map(Number);
                    const startTotal = startHours * 60 + startMinutes;
                    const endTotal = endHours * 60 + endMinutes;
                    let duration = endTotal - startTotal;
                    if (duration < 0) duration += 24 * 60;
                    return duration;
                };

                if (data.service.timeSlots && Array.isArray(data.service.timeSlots)) {
                    data.service.timeSlots.forEach((slot: any) => {
                        const date = new Date(slot.date).toISOString().split('T')[0];
                        if (!grouped[date]) {
                            grouped[date] = [];
                        }

                        // Use price if available, fallback to cost for backward compatibility
                        const price = slot.price || 0;
                        // Use duration if available, otherwise calculate
                        const duration = slot.duration !== undefined ? slot.duration : calculateDuration(slot.startTime, slot.endTime);

                        grouped[date].push({
                            startTime: slot.startTime,
                            endTime: slot.endTime,
                            price,
                            duration,
                            staffIds: (slot.staffIds || []).map((id: any) => String(id)),
                            addOns: slot.addOns || [],
                        });
                    });
                }

                setDatesWithSlots(grouped);

                // Load business and staff
                const businessId = typeof data.service.businessId === 'object'
                    ? data.service.businessId.id || data.service.businessId._id
                    : data.service.businessId;

                if (businessId) {
                    const [businessRes, staffRes] = await Promise.all([
                        fetch(`/api/business/${businessId}`, {
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                        }),
                        fetch(`/api/staff?businessId=${businessId}`, {
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                        }),
                    ]);

                    if (businessRes.ok) {
                        const businessData = await businessRes.json();
                        setBusiness(businessData.business);
                    }

                    if (staffRes.ok) {
                        const staffData = await staffRes.json();
                        setStaff(staffData.staff || []);
                    }
                }
            }
        } catch (err: any) {
            setError("Failed to load service");
            console.error("Error loading service:", err);
        } finally {
            setIsLoadingService(false);
        }
    };

    const onSubmit = async (data: ServiceUpdateInput) => {
        setIsLoading(true);
        setError("");
        setSuccess("");

        // Validate subCategory is selected (it will be used as serviceName)
        if (!data.subCategory) {
            setError("Please select a service name");
            setIsLoading(false);
            return;
        }

        try {
            // Get all time slots with calculated duration
            const timeSlotsForSubmission = getTimeSlotsForSubmission(datesWithSlots);

            const requestData = {
                ...data,
                serviceName: data.subCategory, // Use subCategory as serviceName
                timeSlots: timeSlotsForSubmission.map(slot => ({
                    date: slot.date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    price: slot.price,
                    duration: slot.duration,
                    staffIds: slot.staffIds || [],
                })),
            };

            const response = await fetch(`/api/services/${serviceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use session cookies
                body: JSON.stringify(requestData),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Failed to update service");
                setIsLoading(false);
                return;
            }

            setSuccess("Service updated successfully!");
            setTimeout(() => {
                onSuccess();
            }, 1000);
        } catch (err: any) {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    // Convert duration minutes to string format
    const formatDuration = (minutes: number): string => {
        if (typeof minutes !== "number" || minutes <= 0) return "";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0 && mins > 0) {
            return `${hours}Hr ${mins}mins`;
        } else if (hours > 0) {
            return `${hours}Hr`;
        } else {
            return `${mins}mins`;
        }
    };

    // Convert 24-hour time to 12-hour format with AM/PM
    const formatTime12Hour = (time24: string): string => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
    };

    // Convert 12-hour to 24-hour format
    const convertTo24Hour = (hour: string, minute: string, period: "AM" | "PM"): string => {
        if (!hour) return "";
        let h = parseInt(hour, 10);
        const m = parseInt(minute, 10) || 0;

        if (period === "AM") {
            if (h === 12) h = 0;
        } else {
            if (h !== 12) h += 12;
        }

        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    const selectedSubCategory = watch("subCategory");
    useEffect(() => {
        setSelectedAddOns([]);
    }, [selectedSubCategory]);

    const handleToggleAddOn = (addOn: { name: string; cost: number }) => {
        setSelectedAddOns(prev => {
            const exists = prev.some(item => item.name === addOn.name);
            if (exists) {
                return prev.filter(item => item.name !== addOn.name);
            } else {
                return [...prev, addOn];
            }
        });
    };

    // Check for time conflicts (overlapping time ranges)
    const checkTimeConflict = (startTime24: string, endTime24: string, staffIds: string[]): boolean => {
        if (!selectedDate || !startTime24 || !endTime24) return false;

        const existingSlots = datesWithSlots[selectedDate] || [];
        const start = new Date(`2000-01-01T${startTime24}`);
        const end = new Date(`2000-01-01T${endTime24}`);

        return existingSlots.some((existingSlot: any) => {
            const existingStart = new Date(`2000-01-01T${existingSlot.startTime}`);
            const existingEnd = new Date(`2000-01-01T${existingSlot.endTime}`);
            const existingStaff = (existingSlot.staffIds || []).sort();
            const selectedStaff = staffIds.sort();

            // Check if staff overlap
            const staffOverlap = selectedStaff.length === 0 || existingStaff.length === 0 ||
                selectedStaff.some(id => existingStaff.includes(id));

            if (!staffOverlap) return false;

            // Check if time ranges overlap
            return (start < existingEnd && end > existingStart);
        });
    };

    useEffect(() => {
        if (newTimeSlot.startTime && newTimeSlot.endTime && selectedDate) {
            const selectedStaffIds = newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : [];
            const hasConflict = checkTimeConflict(newTimeSlot.startTime, newTimeSlot.endTime, selectedStaffIds);

            if (hasConflict) {
                setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
            } else {
                setError("");
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [newTimeSlot.startTime, newTimeSlot.endTime, newTimeSlot.staffIds, selectedDate]);

    const handleSelectDate = (date: string) => {
        setSelectedDate(date);
        if (!showTimeSlotForm) {
            setShowTimeSlotForm(true);
        }
        setNewTimeSlot({
            startTime: "",
            endTime: "",
            price: "",
            staffIds: [],
        });
    };

    // Calculate end time from start time (using default 30 min duration for preview)
    // Actual duration will be calculated from start and end time when saving
    const calculateEndTimeFromStart = (startTime: string, defaultDurationMins: number = 30): string => {
        if (!startTime) return "";
        const [hours, minutes] = startTime.split(":").map(Number);
        const startDate = new Date();
        startDate.setHours(hours, minutes, 0, 0);
        const endDate = new Date(startDate.getTime() + defaultDurationMins * 60000);
        const endHours = String(endDate.getHours()).padStart(2, "0");
        const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
        return `${endHours}:${endMinutes} `;
    };

    // Calculate duration in minutes from start and end time
    const calculateDuration = (startTime: string, endTime: string): number => {
        const [startHours, startMinutes] = startTime.split(":").map(Number);
        const [endHours, endMinutes] = endTime.split(":").map(Number);

        const startTotalMinutes = startHours * 60 + startMinutes;
        const endTotalMinutes = endHours * 60 + endMinutes;

        // Handle case where end time is next day (e.g., 23:00 to 01:00)
        let duration = endTotalMinutes - startTotalMinutes;
        if (duration < 0) {
            duration += 24 * 60; // Add 24 hours
        }

        return duration;
    };

    const handleAddTimeSlot = async () => {
        if (!selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime) {
            setTimeSlotError("Please select a date and fill in start time and end time");
            return;
        }

        if (!newTimeSlot.price || newTimeSlot.price === "") {
            setTimeSlotError("Price is required for this time slot");
            return;
        }
        try {
            // Calculate duration from start and end time
            const duration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);

            const slot = {
                startTime: newTimeSlot.startTime,
                endTime: newTimeSlot.endTime,
                price: typeof newTimeSlot.price === "number" ? newTimeSlot.price : parseFloat(String(newTimeSlot.price)),
                duration,
                staffIds: newTimeSlot.staffIds,
                addOns: [...selectedAddOns],
            };

            const existingSlots = datesWithSlots[selectedDate] || [];
            // Check for exact duplicates or conflicts if needed (simplified here)
            const isDuplicate = existingSlots.some((existingSlot: any) => {
                const sameTime = existingSlot.startTime === slot.startTime && existingSlot.endTime === slot.endTime;
                const sameStaff = JSON.stringify((existingSlot.staffIds || []).sort()) === JSON.stringify((slot.staffIds || []).sort());
                return sameTime && sameStaff;
            });

            if (isDuplicate) {
                setTimeSlotError(`This time slot(${formatTime12Hour(slot.startTime)
                    } - ${formatTime12Hour(slot.endTime)
                    }) with the same staff already exists for this date.`);
                return;
            }

            // Add slot to the selected date locally
            const updatedDates = {
                ...datesWithSlots,
                [selectedDate]: [...existingSlots, slot],
            };
            setDatesWithSlots(updatedDates);

            // Convert to flat array and save to API
            const timeSlotsForSubmission = getTimeSlotsForSubmission(updatedDates);
            const response = await fetch(`/api/services/${serviceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use session cookies
                body: JSON.stringify({
                    timeSlots: timeSlotsForSubmission,
                }),
            });

            if (response.ok) {
                setNewTimeSlot({
                    startTime: "",
                    endTime: "",
                    price: "",
                    staffIds: [],
                });
                setError("");
                setTimeSlotError("");
                setSuccess("Time slot added successfully!");
                setTimeout(() => setSuccess(""), 3000);
                // Scroll to show the newly added time slot
                setTimeout(() => {
                    const container = document.getElementById('time-slots-container');
                    if (container) {
                        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            } else {
                // Revert on error
                setDatesWithSlots(datesWithSlots);
                const result = await response.json();
                setTimeSlotError(result.error || "Failed to add time slot");
            }
        } catch (err: any) {
            console.error("Error adding time slot:", err);
            setTimeSlotError("Failed to add time slot");
        }
    };

    const handleDeleteTimeSlot = async (date: string, index: number) => {
        if (!confirm("Are you sure you want to delete this time slot?")) return;

        try {
            const slots = datesWithSlots[date] || [];
            const updatedSlots = slots.filter((_, i) => i !== index);
            const updatedDates = updatedSlots.length === 0
                ? (() => {
                    const { [date]: removed, ...rest } = datesWithSlots;
                    return rest;
                })()
                : {
                    ...datesWithSlots,
                    [date]: updatedSlots,
                };

            // Convert to flat array and save to API
            const timeSlotsForSubmission = getTimeSlotsForSubmission(updatedDates);
            const response = await fetch(`/api/services/${serviceId} `, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use session cookies
                body: JSON.stringify({
                    timeSlots: timeSlotsForSubmission,
                }),
            });

            if (response.ok) {
                setDatesWithSlots(updatedDates);
                setSuccess("Time slot deleted successfully!");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Failed to delete time slot");
            }
        } catch (err: any) {
            setError("Failed to delete time slot");
        }
    };

    const handleRemoveDate = async (date: string) => {
        if (!confirm("Are you sure you want to remove this date and all its time slots?")) return;

        try {
            const { [date]: removed, ...rest } = datesWithSlots;
            const updatedDates = rest;

            // Convert to flat array and save to API
            const timeSlotsForSubmission = getTimeSlotsForSubmission(updatedDates);
            const response = await fetch(`/api/services/${serviceId} `, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                credentials: "include", // Use session cookies
                body: JSON.stringify({
                    timeSlots: timeSlotsForSubmission,
                }),
            });

            if (response.ok) {
                setDatesWithSlots(updatedDates);
                if (selectedDate === date) {
                    setSelectedDate("");
                    setShowTimeSlotForm(false);
                }
                setSuccess("Date and time slots removed successfully!");
                setTimeout(() => setSuccess(""), 3000);
            } else {
                setError("Failed to remove date");
            }
        } catch (err: any) {
            setError("Failed to remove date");
        }
    };

    const handleToggleStaff = (staffId: string) => {
        const updatedStaffIds = newTimeSlot.staffIds.includes(staffId)
            ? newTimeSlot.staffIds.filter(id => id !== staffId)
            : [...newTimeSlot.staffIds, staffId];

        setNewTimeSlot({
            ...newTimeSlot,
            staffIds: updatedStaffIds,
        });

        // Re-check for conflicts when staff changes
        if (newTimeSlot.startTime && selectedDate && newTimeSlot.endTime) {
            const existingSlots = datesWithSlots[selectedDate] || [];
            const isConflict = existingSlots.some((existingSlot: any) => {
                const sameTime = existingSlot.startTime === newTimeSlot.startTime && existingSlot.endTime === newTimeSlot.endTime;
                const sameStaff = JSON.stringify((existingSlot.staffIds || []).sort()) === JSON.stringify(updatedStaffIds.sort());
                return sameTime && sameStaff;
            });

            if (isConflict) {
                setError(`This time slot(${formatTime12Hour(newTimeSlot.startTime)} - ${formatTime12Hour(newTimeSlot.endTime)}) with the selected staff is already booked for this date.`);
            } else {
                setError("");
            }
        }
    };


    // Convert datesWithSlots back to flat array for submission
    const getTimeSlotsForSubmission = (currentDatesWithSlots: typeof datesWithSlots) => {
        const slots: Array<{
            date: string;
            startTime: string;
            endTime: string;
            price: number;
            duration: number; // Calculated duration in minutes
            staffIds: string[];
            addOns?: Array<{ name: string; cost: number }>;
        }> = [];
        Object.entries(currentDatesWithSlots).forEach(([date, timeSlots]) => {
            timeSlots.forEach(slot => {
                const duration = calculateDuration(slot.startTime, slot.endTime);
                slots.push({
                    date,
                    startTime: slot.startTime,
                    endTime: slot.endTime,
                    price: slot.price,
                    duration,
                    staffIds: slot.staffIds,
                    addOns: slot.addOns || [],
                });
            });
        });
        return slots;
    };

    if (isLoadingService) {
        return <div className="flex items-center justify-center py-20 min-h-[400px]">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
        </div>;
    }

    return <div className="bg-white rounded-2xl w-full max-w-4xl mx-auto h-full flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white shrink-0">
            <h2 className="text-2xl font-bold text-[#3A3A3A]">Edit Service</h2>
            <Button variant="ghost" size="sm" onClick={onCancel}>✕</Button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                {error && (
                    <Alert className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
                        <AlertDescription className="text-red-800">{error}</AlertDescription>
                    </Alert>
                )}

                {success && (
                    <Alert className="mb-6 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
                        <AlertDescription className="text-green-800">{success}</AlertDescription>
                    </Alert>
                )}

                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category
                        </label>
                        <Select
                            value={selectedCategory}
                            onValueChange={(val) => setValue("category", val)}
                        >
                            <SelectTrigger className="w-full h-10 md:h-[52px] px-3 md:px-4 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1] text-sm md:text-base text-gray-700 font-normal shadow-sm hover:border-[#EECFD1] transition-all">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] md:max-h-[300px]">
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="cursor-pointer py-2 md:py-3 text-sm md:text-base hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Service Name
                        </label>
                        <Select
                            value={watch("subCategory")}
                            onValueChange={(val) => setValue("subCategory", val)}
                            disabled={!selectedCategory}
                        >
                            <SelectTrigger className={`w-full h-10 md:h-[52px] px-3 md:px-4 rounded-xl border-gray-200 shadow-sm transition-all text-sm md:text-base text-gray-700 font-normal ${!selectedCategory ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white hover:border-[#EECFD1] focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1]"}`}>
                                <SelectValue placeholder={selectedCategory && SUB_CATEGORIES[selectedCategory] ? "Select Service Name" : "Select Category First"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[200px] md:max-h-[300px]">
                                {selectedCategory && SUB_CATEGORIES[selectedCategory] && SUB_CATEGORIES[selectedCategory].map((subCat) => (
                                    <SelectItem key={subCat} value={subCat} className="cursor-pointer py-2 md:py-3 text-sm md:text-base hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
                                        {subCat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>


                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Address <span className="text-red-500">*</span>
                        </label>
                        <AddressAutocomplete
                            control={control}
                            name="address"
                            placeholder="123 Main St, City"
                            error={errors.address?.message}
                            required
                            returnObject={true}
                            setValue={setValue}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Description
                        </label>
                        <textarea
                            {...register("description")}
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1] transition-all resize-none text-sm"
                            placeholder="Describe your service..."
                        />
                    </div>

                    {/* Time Slots Section */}
                    <div className="pt-6 border-t border-gray-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#3A3A3A]">Time Slots & Dates</h3>
                        </div>

                        {/* Stacked Layout for Dates & Slots */}
                        <div className="space-y-6">
                            {/* Toolbar */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-[#3A3A3A] uppercase tracking-wider">Availability</h3>
                                    <p className="text-xs text-gray-500">Manage dates and time slots for this service.</p>
                                </div>
                                <div className="relative">
                                    {/* Mobile: Native date input styled as button */}
                                    <div className="md:hidden">
                                        <div className="relative flex items-center justify-center gap-2 h-10 px-3 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-[#3A3A3A]">
                                            <span className="pointer-events-none">+</span>
                                            <span className="pointer-events-none">Add Date</span>
                                            <input
                                                type="date"
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleSelectDate(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Desktop: Native date input styled as button */}
                                    <div className="hidden md:block">
                                        <div className="relative flex items-center justify-center gap-2 h-9 px-4 text-xs font-semibold rounded-lg border border-gray-200 bg-white text-[#3A3A3A] hover:bg-gray-50 transition-all">
                                            <span className="pointer-events-none text-lg leading-none">+</span>
                                            <span className="pointer-events-none">Add Date</span>
                                            <input
                                                type="date"
                                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                min={new Date().toISOString().split('T')[0]}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleSelectDate(e.target.value);
                                                        e.target.value = '';
                                                    }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Dates List */}
                            <div className="space-y-6">
                                {Object.keys(datesWithSlots).length === 0 ? (
                                    <div className="text-center py-10 px-4 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                                        <p className="text-sm font-medium text-gray-900">No dates added yet</p>
                                        <p className="text-xs text-gray-500 mt-1">Add dates to start setting up availability.</p>
                                    </div>
                                ) : (
                                    Object.entries(datesWithSlots)
                                        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                                        .map(([date, slots]) => (
                                            <div key={date} className="group border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                                {/* Clean Date Header */}
                                                <div className="flex items-center justify-between px-5 py-4 bg-gray-50/50 border-b border-gray-100">
                                                    <div className="flex items-center gap-3">
                                                        <h4 className="flex flex-col">
                                                            <span className="text-sm font-bold text-[#3A3A3A] uppercase tracking-wide">
                                                                {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-medium">
                                                                {slots.length} {slots.length === 1 ? 'Slot' : 'Slots'}
                                                            </span>
                                                        </h4>
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRemoveDate(date)}
                                                        className="text-gray-400 hover:text-red-500 h-11 w-11 sm:h-8 sm:w-8 p-0 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </Button>
                                                </div>

                                                {/* Slots Grid - Table Row Style */}
                                                <div className="px-5 pb-5">
                                                    <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 bg-white">
                                                        {slots.map((slot, index) => {
                                                            const assignedStaff = staff.filter(s => slot.staffIds?.includes(s.id || s._id));
                                                            return (
                                                                <div key={index} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-gray-50/50 transition-colors gap-3 sm:gap-4">
                                                                    {/* Time & Price Group */}
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="bg-gray-50 px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs md:text-sm font-bold text-[#3A3A3A] border border-gray-200 min-w-[120px] md:min-w-[140px] text-center">
                                                                            {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                                                        </div>
                                                                        <div className="text-sm md:text-base font-bold text-[#3A3A3A]">
                                                                            ${typeof slot.price === 'number' ? slot.price.toFixed(2) : slot.price}
                                                                        </div>
                                                                    </div>

                                                                    {/* Details Group */}
                                                                    <div className="flex flex-wrap items-center gap-3 flex-1 sm:justify-end">
                                                                        {assignedStaff.length > 0 && (
                                                                            <div className="flex -space-x-1.5">
                                                                                {assignedStaff.map(s => (
                                                                                    <div key={s.id || s._id} className="w-6 h-6 rounded-full border border-white bg-gray-200 overflow-hidden" title={s.name}>
                                                                                        {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-gray-500">{s.name[0]}</div>}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}

                                                                        {slot.addOns && slot.addOns.length > 0 && (
                                                                            <div className="flex items-center gap-1 bg-[#FFF5F6] px-2 py-1 rounded-full text-[10px] font-bold text-[#3A3A3A] border border-[#ffebed]">
                                                                                <span>+{slot.addOns.length} Add-ons</span>
                                                                            </div>
                                                                        )}

                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleDeleteTimeSlot(date, index)}
                                                                            className="w-11 h-11 sm:w-8 sm:h-8 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all ml-2"
                                                                            title="Remove Slot"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}

                                                        {/* Add Slot Action Row */}
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedDate(date);
                                                                handleSelectDate(date);
                                                            }}
                                                            className="w-full flex items-center justify-center gap-2 p-3 text-xs font-bold text-gray-400 hover:text-[#3A3A3A] hover:bg-gray-50 transition-colors"
                                                        >
                                                            <span>+ Add Time Slot</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                )}
                            </div>
                        </div>

                        {/* Modal for Adding Time Slots */}
                        <Modal
                            isOpen={showTimeSlotForm}
                            onClose={() => setShowTimeSlotForm(false)}
                            title={`Add Slot for ${selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) : ''}`}
                        >
                            <div className="space-y-6">
                                {timeSlotError && (
                                    <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        {timeSlotError}
                                    </div>
                                )}

                                <div className="space-y-6 max-h-[60vh] sm:max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
                                    {/* Time Selection */}
                                    <div className="space-y-4">

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                            <TimeSelect
                                                label="Start Time"
                                                value={newTimeSlot.startTime}
                                                onChange={(val) => {
                                                    setNewTimeSlot(prev => ({ ...prev, startTime: val }));
                                                    if (!newTimeSlot.endTime) {
                                                        const [h, m] = val.split(':').map(Number);
                                                        const date = new Date();
                                                        date.setHours(h, m + 60);
                                                        const endH = date.getHours().toString().padStart(2, '0');
                                                        const endM = date.getMinutes().toString().padStart(2, '0');
                                                        setNewTimeSlot(prev => ({ ...prev, startTime: val, endTime: `${endH}:${endM}` }));
                                                    }
                                                }}
                                                required
                                            />
                                            <TimeSelect
                                                label="End Time"
                                                value={newTimeSlot.endTime}
                                                onChange={(val) => setNewTimeSlot(prev => ({ ...prev, endTime: val }))}
                                                required
                                            />
                                        </div>

                                        {/* Duration Display */}
                                        {newTimeSlot.startTime && newTimeSlot.endTime && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-[#FFF5F6] border border-[#EECFD1]/30 rounded-lg">
                                                <svg className="w-4 h-4 text-[#3A3A3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span className="text-sm font-medium text-[#3A3A3A]">
                                                    Duration: {formatDuration(calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime))}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Price Input */}
                                    <div>
                                        <label className="text-sm font-semibold text-[#3A3A3A] block mb-2">
                                            Price ($) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                            <input
                                                type="number"
                                                value={newTimeSlot.price}
                                                onChange={(e) => {
                                                    const val = parseFloat(e.target.value);
                                                    setNewTimeSlot({ ...newTimeSlot, price: isNaN(val) ? '' : val });
                                                }}
                                                className="w-full pl-8 pr-4 h-[52px] bg-white border border-[#E5E5E5] rounded-xl text-base font-medium text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all placeholder:text-gray-300"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gray-100 w-full" />

                                    {/* Staff Selection */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Assign Staff</label>
                                        <div className="flex flex-wrap gap-2">
                                            {staff.map(member => {
                                                const isSelected = newTimeSlot.staffIds.includes(member.id || member._id);
                                                return (
                                                    <button
                                                        key={member.id || member._id}
                                                        type="button"
                                                        onClick={() => handleToggleStaff(member.id || member._id)}
                                                        className={`group flex items-center gap-2 pl-1 pr-4 py-2 sm:py-1.5 rounded-full border transition-all min-h-[44px] sm:min-h-0 ${isSelected
                                                            ? 'bg-[#3A3A3A] border-[#3A3A3A] text-white shadow-md'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold ${isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                                            {member.photo ? (
                                                                <img src={member.photo} alt="" className="w-full h-full object-cover" />
                                                            ) : (
                                                                member.name[0]
                                                            )}
                                                        </div>
                                                        <span className="text-sm font-medium">{member.name}</span>
                                                        {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="h-px bg-gray-100 w-full" />

                                    {/* Add-Ons Selection (Vertical List) */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Add-Ons</label>
                                        {selectedCategory && getAddOnsByCategory(selectedCategory).length > 0 ? (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
                                                {getAddOnsByCategory(selectedCategory).map((addOnName, idx) => {
                                                    const existing = selectedAddOns.find(a => a.name === addOnName);
                                                    const isSelected = !!existing;

                                                    return (
                                                        <div key={idx} className={`flex items-center justify-between p-4 sm:p-3 transition-colors ${isSelected ? 'bg-[#FFF5F6]/30' : 'bg-white hover:bg-gray-50'}`}>
                                                            <div className="flex items-center gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (isSelected) {
                                                                            setSelectedAddOns(prev => prev.filter(p => p.name !== addOnName));
                                                                        } else {
                                                                            setSelectedAddOns(prev => [...prev, { name: addOnName, cost: 0 }]);
                                                                        }
                                                                    }}
                                                                    className={`w-6 h-6 sm:w-5 sm:h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#3A3A3A] border-[#3A3A3A] text-white' : 'border-gray-300 bg-white'}`}
                                                                >
                                                                    {isSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                                </button>
                                                                <span className={`text-sm font-medium ${isSelected ? 'text-[#3A3A3A]' : 'text-gray-500'}`}>{addOnName}</span>
                                                            </div>

                                                            {isSelected && (
                                                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-5 duration-200">
                                                                    <span className="text-xs font-bold text-gray-400 uppercase">Extra Price</span>
                                                                    <div className="relative w-24">
                                                                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                                                        <input
                                                                            type="number"
                                                                            value={existing.cost || ""}
                                                                            onChange={(e) => {
                                                                                const val = parseFloat(e.target.value) || 0;
                                                                                setSelectedAddOns(prev => prev.map(p => p.name === addOnName ? { ...p, cost: val } : p));
                                                                            }}
                                                                            onFocus={(e) => {
                                                                                // Clear "0" when user focuses to start typing
                                                                                if (e.target.value === "0") {
                                                                                    setSelectedAddOns(prev => prev.map(p => p.name === addOnName ? { ...p, cost: 0 } : p));
                                                                                }
                                                                            }}
                                                                            className="w-full pl-5 pr-2 py-1.5 text-right text-sm font-bold bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#EECFD1] focus:ring-1 focus:ring-[#EECFD1]"
                                                                            placeholder="0.00"
                                                                        />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-gray-400 italic">No add-ons available for this category.</p>
                                        )}
                                    </div>

                                    <div className="pt-2">
                                        <Button
                                            onClick={handleAddTimeSlot}
                                            className="w-full bg-[#3A3A3A] hover:bg-black text-white h-10 md:h-12 rounded-xl text-sm md:text-base font-bold shadow-lg shadow-gray-200/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                                        >
                                            Save Time Slot
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </Modal>

                    </div>
                </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-4 bg-white shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-10">
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 h-10 md:h-12 rounded-xl text-sm md:text-base font-semibold border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-10 md:h-12 rounded-xl text-sm md:text-base font-semibold bg-[#EECFD1] hover:bg-[#e5c4c7] text-white shadow-md disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    </div>
}
