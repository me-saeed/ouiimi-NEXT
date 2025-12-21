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
    } = useForm<ServiceUpdateInput>({
        resolver: zodResolver(serviceUpdateSchema),
    });

    const selectedCategory = watch("category");

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                loadService();
            } catch (e) {
                console.error("Error parsing user data:", e);
                // Handle auth error if needed, maybe call onCancel or show error
            }
        }
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
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/services/${serviceId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                setError("Failed to load service");
                setIsLoadingService(false);
                return;
            }

            const data = await response.json();
            if (data.service) {
                setService(data.service);
                setValue("category", data.service.category);
                // Use serviceName as subCategory if subCategory doesn't exist (for backward compatibility)
                const subCategoryValue = data.service.subCategory || data.service.serviceName || "";
                setValue("subCategory", subCategoryValue);
                setValue("serviceName", data.service.serviceName); // Keep for API but will be replaced with subCategory
                setValue("description", data.service.description || "");

                // Handle address - could be string (old) or object (new)
                if (typeof data.service.address === 'object' && data.service.address?.street) {
                    setValue("address", data.service.address);
                } else if (typeof data.service.address === 'string') {
                    // Legacy: convert string address to object format (will need geocoding on save)
                    setValue("address", {
                        street: data.service.address,
                        location: {
                            type: "Point",
                            coordinates: [0, 0], // Will need to be geocoded
                        },
                    });
                }

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
                            headers: { Authorization: `Bearer ${token}` },
                        }),
                        fetch(`/api/staff?businessId=${businessId}`, {
                            headers: { Authorization: `Bearer ${token}` },
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
            const token = localStorage.getItem("token");
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
                    Authorization: `Bearer ${token}`,
                },
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
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/services/${serviceId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token} `,
                },
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
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/services/${serviceId} `, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token} `,
                },
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
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/services/${serviceId} `, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token} `,
                },
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
                            <SelectTrigger className="w-full h-[52px] rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1] text-gray-700 font-normal shadow-sm hover:border-[#EECFD1] transition-all">
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {CATEGORIES.map((cat) => (
                                    <SelectItem key={cat} value={cat} className="cursor-pointer py-3 hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
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
                            <SelectTrigger className={`w-full h-[52px] rounded-xl border-gray-200 shadow-sm transition-all text-gray-700 font-normal ${!selectedCategory ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white hover:border-[#EECFD1] focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1]"}`}>
                                <SelectValue placeholder={selectedCategory && SUB_CATEGORIES[selectedCategory] ? "Select Service Name" : "Select Category First"} />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {selectedCategory && SUB_CATEGORIES[selectedCategory] && SUB_CATEGORIES[selectedCategory].map((subCat) => (
                                    <SelectItem key={subCat} value={subCat} className="cursor-pointer py-3 hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
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

                        {/* Master-Detail Layout for Dates & Slots */}
                        <div className="flex flex-col md:flex-row gap-6 h-[500px] border border-gray-100 rounded-2xl overflow-hidden">
                            {/* LEFT SIDEBAR: Date List */}
                            <div className="w-full md:w-1/3 bg-gray-50 border-r border-gray-100 flex flex-col">
                                <div className="p-4 border-b border-gray-100 bg-white">
                                    <h3 className="font-bold text-[#3A3A3A] text-sm mb-1">Available Dates</h3>
                                    <p className="text-xs text-gray-500">Select a date to manage slots</p>
                                </div>

                                {/* Date List */}
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-2">
                                    <div className="relative mb-4">
                                        <input
                                            type="date"
                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] transition-all"
                                            min={new Date().toISOString().split('T')[0]}
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    // Add date and select it
                                                    handleSelectDate(e.target.value);
                                                    e.target.value = '';
                                                }
                                            }}
                                        />
                                        <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none text-gray-400">
                                            <span className="text-xs font-bold">+</span>
                                        </div>
                                    </div>

                                    {Object.entries(datesWithSlots)
                                        .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                                        .map(([date, slots]) => (
                                            <div
                                                key={date}
                                                onClick={() => {
                                                    setSelectedDate(date);
                                                    setShowTimeSlotForm(false);
                                                }}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all group flex justify-between items-center ${selectedDate === date
                                                    ? "bg-white border-[#EECFD1] shadow-sm ring-1 ring-[#EECFD1]/30"
                                                    : "bg-white/50 border-transparent hover:bg-white hover:border-gray-200"
                                                    }`}
                                            >
                                                <div>
                                                    <div className={`text-sm font-semibold ${selectedDate === date ? "text-[#3A3A3A]" : "text-gray-600"}`}>
                                                        {new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-0.5">
                                                        {slots.length} {slots.length === 1 ? 'slot' : 'slots'}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRemoveDate(date);
                                                    }}
                                                    className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-all"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}

                                    {Object.keys(datesWithSlots).length === 0 && (
                                        <div className="text-center py-8 px-4 text-gray-400 text-xs italic">
                                            No dates added.<br />Use the picker above to add a date.
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* RIGHT PANEL: Slots for Selected Date */}
                            <div className="w-full md:w-2/3 bg-white flex flex-col h-full">
                                {selectedDate ? (
                                    <>
                                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-white sticky top-0 z-10">
                                            <div>
                                                <h4 className="font-bold text-[#3A3A3A]">
                                                    {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                                                </h4>
                                                <p className="text-xs text-gray-500">Manage time slots for this date</p>
                                            </div>
                                            <Button
                                                type="button"
                                                size="sm"
                                                onClick={() => setShowTimeSlotForm(true)}
                                                className={`bg-[#EECFD1] hover:bg-[#e5c4c7] text-white shadow-sm transition-all ${showTimeSlotForm ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                disabled={showTimeSlotForm}
                                            >
                                                + Add Time Slot
                                            </Button>
                                        </div>

                                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                            {/* Add Slot Form */}
                                            {showTimeSlotForm && (
                                                <div className="mb-6 bg-gray-50 p-4 rounded-xl border border-[#EECFD1]/50 animate-in slide-in-from-top-2 duration-200">
                                                    <div className="flex justify-between items-center mb-4">
                                                        <h5 className="font-semibold text-sm text-[#3A3A3A]">New Time Slot</h5>
                                                        <Button variant="ghost" size="sm" onClick={() => setShowTimeSlotForm(false)} className="h-6 w-6 p-0 rounded-full hover:bg-gray-200">✕</Button>
                                                    </div>

                                                    {timeSlotError && (
                                                        <p className="text-xs text-red-500 mb-3 bg-red-50 p-2 rounded">{timeSlotError}</p>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <TimeSelect
                                                            label="Start"
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
                                                        />
                                                        <TimeSelect
                                                            label="End"
                                                            value={newTimeSlot.endTime}
                                                            onChange={(val) => setNewTimeSlot(prev => ({ ...prev, endTime: val }))}
                                                        />
                                                    </div>

                                                    <div className="grid grid-cols-1 mb-4">
                                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Price</label>
                                                        <div className="relative">
                                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                                            <input
                                                                type="number"
                                                                value={newTimeSlot.price}
                                                                onChange={(e) => {
                                                                    const val = parseFloat(e.target.value);
                                                                    setNewTimeSlot({ ...newTimeSlot, price: isNaN(val) ? '' : val });
                                                                }}
                                                                className="w-full pl-6 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#EECFD1]"
                                                                placeholder="0.00"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Add-Ons Selection */}
                                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                                        <div className="flex items-center justify-between">
                                                            <label className="block text-xs font-semibold text-gray-700">
                                                                Add-Ons <span className="text-gray-400 font-normal">(Optional)</span>
                                                            </label>
                                                            <button
                                                                type="button"
                                                                onClick={() => setIsAddOnsDropdownOpen(!isAddOnsDropdownOpen)}
                                                                className="text-xs font-medium text-[#EECFD1] hover:text-[#dcb0b3]"
                                                            >
                                                                {isAddOnsDropdownOpen ? "Close" : "+ Add Add-On"}
                                                            </button>
                                                        </div>

                                                        {isAddOnsDropdownOpen && (
                                                            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 mb-3 animate-in fade-in zoom-in-95 duration-200">
                                                                <p className="text-xs text-gray-500 mb-2">Select available add-ons and set pricing:</p>
                                                                <div className="space-y-2">
                                                                    {selectedCategory && getAddOnsByCategory(selectedCategory).map((addOnName, idx) => {
                                                                        const existingAddOn = selectedAddOns.find(a => a.name === addOnName);
                                                                        const isSelected = !!existingAddOn;

                                                                        return (
                                                                            <div key={idx} className="flex items-center gap-2">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        if (isSelected) {
                                                                                            setSelectedAddOns(prev => prev.filter(a => a.name !== addOnName));
                                                                                        } else {
                                                                                            setSelectedAddOns(prev => [...prev, { name: addOnName, cost: 0 }]);
                                                                                        }
                                                                                    }}
                                                                                    className={`px-3 py-1.5 rounded-full text-xs transition-colors border flex-shrink-0 ${isSelected
                                                                                        ? "bg-[#3A3A3A] text-white border-[#3A3A3A]"
                                                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                                                        }`}
                                                                                >
                                                                                    {addOnName}
                                                                                </button>

                                                                                {isSelected && (
                                                                                    <div className="flex items-center gap-1">
                                                                                        <span className="text-xs text-gray-500">$</span>
                                                                                        <input
                                                                                            type="number"
                                                                                            min="0"
                                                                                            step="0.01"
                                                                                            value={existingAddOn.cost || ''}
                                                                                            onChange={(e) => {
                                                                                                const newCost = parseFloat(e.target.value) || 0;
                                                                                                setSelectedAddOns(prev =>
                                                                                                    prev.map(a =>
                                                                                                        a.name === addOnName ? { ...a, cost: newCost } : a
                                                                                                    )
                                                                                                );
                                                                                            }}
                                                                                            placeholder="0.00"
                                                                                            className="w-16 px-2 py-1 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-[#EECFD1]"
                                                                                        />
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {(!selectedCategory || getAddOnsByCategory(selectedCategory).length === 0) && (
                                                                        <p className="text-xs text-gray-400 italic">No add-ons available for this category.</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedAddOns.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {selectedAddOns.map((addOn, idx) => (
                                                                    <div key={idx} className="bg-[#FFF5F6] border border-[#ffebed] rounded-full px-2 py-1 flex items-center gap-1.5">
                                                                        <span className="text-xs font-bold text-[#3A3A3A]">{addOn.name} (${addOn.cost})</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleToggleAddOn(addOn)}
                                                                            className="text-gray-400 hover:text-red-500 rounded-full p-0.5"
                                                                        >
                                                                            ✕
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="mb-4 pt-2">
                                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Staff</label>
                                                        <div className="flex flex-wrap gap-2">
                                                            {staff.map((member) => (
                                                                <button
                                                                    key={member.id || member._id}
                                                                    type="button"
                                                                    onClick={() => handleToggleStaff(member.id || member._id)}
                                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${newTimeSlot.staffIds.includes(member.id || member._id)
                                                                        ? "bg-[#3A3A3A] border-[#3A3A3A] text-white"
                                                                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                                                                        }`}
                                                                >
                                                                    {member.name}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <Button onClick={handleAddTimeSlot} className="w-full bg-[#3A3A3A] hover:bg-black text-white h-9 text-xs uppercase tracking-wide">
                                                        Add Slot
                                                    </Button>
                                                </div>
                                            )}

                                            {/* Logic for Displaying Slots */}
                                            {(() => {
                                                const slots = datesWithSlots[selectedDate] || [];
                                                if (slots.length === 0 && !showTimeSlotForm) {
                                                    return (
                                                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                                                            <div className="bg-gray-50 p-4 rounded-full mb-3">
                                                                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                            </div>
                                                            <p className="text-sm">No time slots for this date.</p>
                                                            <p className="text-xs mt-1">Click &quot;Add Time Slot&quot; to start.</p>
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <div className="grid grid-cols-1 gap-3">
                                                        {slots.map((slot, index) => (
                                                            <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-[#EECFD1] hover:shadow-md transition-all group">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="bg-[#FFF5F6] px-4 py-2.5 rounded-xl text-base font-bold text-[#3A3A3A] border border-[#ffebed] whitespace-nowrap">
                                                                        {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-base font-bold text-gray-800">${slot.price}</span>
                                                                        {slot.staffIds && slot.staffIds.length > 0 && (
                                                                            <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                                                                {slot.staffIds.map(id => staff.find(s => (s.id || s._id) === id)?.name.split(' ')[0]).join(', ')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteTimeSlot(selectedDate, index)}
                                                                    className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 bg-gray-50 hover:bg-red-50"
                                                                    title="Delete Slot"
                                                                >
                                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
                                        <svg className="w-12 h-12 mb-4 text-gray-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                        <p className="text-sm font-medium">No date selected</p>
                                        <p className="text-xs mt-1">Select or add a date from the left to manage slots</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex gap-4 bg-white shrink-0 shadow-[0_-5px_10px_rgba(0,0,0,0.02)] z-10">
                <Button
                    type="button"
                    onClick={onCancel}
                    disabled={isLoading}
                    variant="outline"
                    className="flex-1 h-12 rounded-xl text-base font-semibold border-gray-200 hover:bg-gray-50 text-gray-700"
                >
                    Cancel
                </Button>
                <Button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 h-12 rounded-xl text-base font-semibold bg-[#EECFD1] hover:bg-[#e5c4c7] text-white shadow-md disabled:opacity-50"
                >
                    {isLoading ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    </div>
}
