"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceCreateSchema, type ServiceCreateInput } from "@/lib/validation";
import { z } from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

const CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Skin & Facials",
  "Dog Grooming",
];

const SUB_CATEGORIES: Record<string, string[]> = {
  "Hair Services": ["Haircut", "Colouring", "Blow-Dry & Styling", "Treatment", "Extensions", "Men's Cut", "Women's Cut", "Kids Cut"],
  "Nails": ["Manicure", "Pedicure", "Gel", "Acrylic", "Nail Art", "Removal"],
  "Beauty & Brows": ["Brows", "Lashes", "Makeup", "Facial", "Waxing", "Threading", "Tinting"],
  "Massage & Wellness": ["Massage", "Spa", "Sauna", "Physio", "Chiro", "Acupuncture"],
  "Skin & Facials": ["Basic Facial", "Anti-Aging", "Acne Treatment", "Microdermabrasion", "Peel"],
  "Dog Grooming": ["Wash", "Cut", "Nails", "Full Groom", "Puppy Groom", "De-shedding"],
};

export default function CreateServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const [defaultStaffIds, setDefaultStaffIds] = useState<string[]>([]);
  const [durationMinutes, setDurationMinutes] = useState<number | "">(""); // Duration in minutes
  const [durationError, setDurationError] = useState<string>("");
  // Group time slots by date: { "2025-10-30": [{ startTime, endTime, cost, staffIds }] }
  const [datesWithSlots, setDatesWithSlots] = useState<Record<string, Array<{
    startTime: string;
    endTime: string;
    cost?: number;
    staffIds: string[];
  }>>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({
    startTime: "",
    endTime: "",
    staffIds: [] as string[],
  });
  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

  // Form schema without businessId (we add it dynamically)
  // Make serviceName optional since we use subCategory instead, and make subCategory required
  const formSchema = serviceCreateSchema.omit({ businessId: true }).extend({
    serviceName: z.string().optional(),
    subCategory: z.string().min(1, "Service name is required"),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<Omit<ServiceCreateInput, 'businessId'>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change
  });

  const selectedCategory = watch("category");

  useEffect(() => {
    // Reset subCategory when category changes
    if (selectedCategory) {
      setValue("subCategory", "");
    }
  }, [selectedCategory, setValue]);

  useEffect(() => {
    // Update duration field when durationMinutes changes
    if (durationMinutes !== "" && typeof durationMinutes === "number" && durationMinutes >= 15) {
    setValue("duration", formatDuration(durationMinutes));
      setDurationError("");
    } else {
      setValue("duration", "");
    }
  }, [durationMinutes, setValue]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadStaff(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  const loadStaff = async (userData: any) => {
    try {
      const token = localStorage.getItem("token");
      const userId = userData.id || userData._id;

      // Find business
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        if (businessData.businesses && businessData.businesses.length > 0) {
          const businessId = businessData.businesses[0].id || businessData.businesses[0]._id;

          // Load staff
          const staffResponse = await fetch(`/api/staff?businessId=${businessId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });

          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            setStaff(staffData.staff || []);
          }
        }
      }
    } catch (err) {
      console.error("Error loading staff:", err);
    }
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

  // Calculate end time from start time + duration
  const calculateEndTime = (startTime: string, durationMins: number): string => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMins * 60000);
    const endHours = String(endDate.getHours()).padStart(2, "0");
    const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
    return `${endHours}:${endMinutes}`;
  };

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    if (!showTimeSlotForm) {
    setShowTimeSlotForm(true);
    }
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      staffIds: [...defaultStaffIds],
    });
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
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

  const handleTimeChange = () => {
    if (!startHour) {
    setNewTimeSlot({
      ...newTimeSlot,
        startTime: "",
        endTime: "",
      });
      setError("");
      return;
    }

    const startTime24 = convertTo24Hour(startHour, startMinute, startPeriod);
    const endTime24 = calculateEndTime(startTime24, typeof durationMinutes === "number" ? durationMinutes : 30);
    
    if (!endTime24) {
      setError("Invalid time selection");
      return;
    }

    // Check for conflicts with existing slots
    const selectedStaffIds = newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : defaultStaffIds;
    const hasConflict = checkTimeConflict(startTime24, endTime24, selectedStaffIds);

    if (hasConflict) {
      setError(`This time slot (${startHour}:${startMinute} ${startPeriod} - ${formatTime12Hour(endTime24)}) conflicts with an existing booking for the selected staff on this date. Please select a different time.`);
      return;
    }

    setNewTimeSlot({
      ...newTimeSlot,
      startTime: startTime24,
      endTime: endTime24,
    });
    setError("");
  };

  useEffect(() => {
    if (startHour && startMinute && startPeriod) {
      const startTime24 = convertTo24Hour(startHour, startMinute, startPeriod);
      const endTime24 = calculateEndTime(startTime24, typeof durationMinutes === "number" ? durationMinutes : 30);
      
      if (endTime24) {
        const selectedStaffIds = newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : defaultStaffIds;
        const hasConflict = checkTimeConflict(startTime24, endTime24, selectedStaffIds);

        if (hasConflict) {
          setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
        } else {
          setError("");
        }

        setNewTimeSlot({
          ...newTimeSlot,
          startTime: startTime24,
          endTime: endTime24,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour, startMinute, startPeriod, durationMinutes]);

  useEffect(() => {
    if (newTimeSlot.startTime && newTimeSlot.endTime && selectedDate) {
      const selectedStaffIds = newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : defaultStaffIds;
      const hasConflict = checkTimeConflict(newTimeSlot.startTime, newTimeSlot.endTime, selectedStaffIds);

      if (hasConflict) {
        setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
      } else {
        setError("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTimeSlot.staffIds, selectedDate]);

  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTimeSlot.startTime) {
      setError("Please select a date and start time");
      return;
    }

    if (!newTimeSlot.endTime) {
      setError("End time is required");
      return;
    }

    // Final check for conflicts (in case staff was changed after time selection)
    const slot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      staffIds: newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : defaultStaffIds,
    };

    const hasConflict = checkTimeConflict(slot.startTime, slot.endTime, slot.staffIds);

    if (hasConflict) {
      setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
      return;
    }

    // Add slot to the selected date
    setDatesWithSlots({
      ...datesWithSlots,
      [selectedDate]: [...existingSlots, slot],
    });

    // Reset form but keep date selected and default staff
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      staffIds: [...defaultStaffIds],
    });
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
    setError("");
    toast({
      variant: "success",
      title: "Time slot added!",
      description: `Added time slot for ${new Date(selectedDate).toLocaleDateString()}`,
    });
  };

  const handleRemoveTimeSlot = (date: string, index: number) => {
    const slots = datesWithSlots[date] || [];
    const updatedSlots = slots.filter((_, i) => i !== index);
    if (updatedSlots.length === 0) {
      const { [date]: removed, ...rest } = datesWithSlots;
      setDatesWithSlots(rest);
    } else {
      setDatesWithSlots({
        ...datesWithSlots,
        [date]: updatedSlots,
      });
    }
  };

  const handleRemoveDate = (date: string) => {
    const { [date]: removed, ...rest } = datesWithSlots;
    setDatesWithSlots(rest);
    if (selectedDate === date) {
      setSelectedDate("");
      setShowTimeSlotForm(false);
    }
  };

  const handleToggleStaff = (staffId: string, isDefault: boolean = false) => {
    if (isDefault) {
      setDefaultStaffIds(prev =>
        prev.includes(staffId)
          ? prev.filter(id => id !== staffId)
          : [...prev, staffId]
      );
    } else {
    setNewTimeSlot({
      ...newTimeSlot,
      staffIds: newTimeSlot.staffIds.includes(staffId)
        ? newTimeSlot.staffIds.filter(id => id !== staffId)
        : [...newTimeSlot.staffIds, staffId],
    });
    }
  };

  // Convert duration minutes to string format
  const formatDuration = (minutes: number | ""): string => {
    if (minutes === "" || typeof minutes !== "number") return "";
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

  // Convert datesWithSlots back to flat array for submission
  const getTimeSlotsForSubmission = () => {
    const slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      cost?: number;
      staffIds: string[];
    }> = [];
    Object.entries(datesWithSlots).forEach(([date, timeSlots]) => {
      timeSlots.forEach(slot => {
        slots.push({
          date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          cost: slot.cost,
          staffIds: slot.staffIds,
        });
      });
    });
    return slots;
  };

  const onSubmit = async (data: Omit<ServiceCreateInput, 'businessId'>) => {
    // Validate that dates and time slots are added
    if (Object.keys(datesWithSlots).length === 0) {
      setError("Please add at least one date with time slots");
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please add at least one date with time slots",
      });
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in to create a service");
        setIsLoading(false);
        router.push("/signin");
        return;
      }

      const userData = localStorage.getItem("user");
      if (!userData) {
        setError("User data not found. Please sign in again.");
        setIsLoading(false);
        router.push("/signin");
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id || parsedUser._id;

      if (!userId) {
        setError("User ID not found. Please sign in again.");
        setIsLoading(false);
        return;
      }



      // First, find the business for this user
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!businessResponse.ok) {
        setError("Failed to find your business. Please register a business first.");
        setIsLoading(false);
        return;
      }

      const businessData = await businessResponse.json();
      if (!businessData.businesses || businessData.businesses.length === 0) {
        setError("No business found. Please register a business first.");
        setIsLoading(false);
        return;
      }

      const foundBusinessId = businessData.businesses[0].id || businessData.businesses[0]._id;

      if (!foundBusinessId) {
        setError("Business ID not found. Please register a business first.");
        setIsLoading(false);
        return;
      }



      // Validate subCategory is selected (it will be used as serviceName)
      if (!data.subCategory) {
        setError("Please select a service name");
        setIsLoading(false);
        return;
      }

      // Validate duration
      if (durationMinutes === "" || typeof durationMinutes !== "number" || durationMinutes < 15) {
        setDurationError("Duration is required and must be at least 15 minutes");
        setError("Please enter a valid duration (minimum 15 minutes)");
        setIsLoading(false);
        return;
      }
      if (durationMinutes > 180) {
        setDurationError("Duration cannot exceed 3 hours (180 minutes)");
        setError("Duration cannot exceed 3 hours (180 minutes)");
        setIsLoading(false);
        return;
      }

      const timeSlotsForSubmission = getTimeSlotsForSubmission();
      const requestBody = {
        ...data,
        serviceName: data.subCategory, // Use subCategory as serviceName
        businessId: foundBusinessId,
        duration: formatDuration(durationMinutes),
        defaultStaffIds: defaultStaffIds,
        timeSlots: timeSlotsForSubmission.length > 0 ? timeSlotsForSubmission.map(slot => ({
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          cost: slot.cost !== undefined ? slot.cost : data.baseCost,
          staffIds: slot.staffIds || [],
        })) : undefined,
      };



      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.details || "Failed to create service";
        console.error("Service creation failed:", errorMsg, result);

        let displayError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        if (result.details && Array.isArray(result.details)) {
          displayError += ": " + result.details.map((d: any) => d.message || d).join(", ");
        }

        setError(displayError);

        toast({
          variant: "destructive",
          title: "Error",
          description: displayError,
        });

        setIsLoading(false);
        return;
      }



      toast({
        variant: "success",
        title: "Success!",
        description: "Service created successfully!",
      });

      setSuccess("Service created successfully! Redirecting...");

      await new Promise(resolve => setTimeout(resolve, 2000));
      router.push("/business/dashboard?tab=list");
    } catch (err: any) {
      console.error("Service creation error:", err);
      const errorMsg = err.message || "Something went wrong. Please try again.";
      setError(errorMsg);

      toast({
        variant: "destructive",
        title: "Error",
        description: errorMsg,
      });

      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] mb-2">
              Create Service
            </h1>
            <p className="text-[#888888]">
              Add a new service to your business
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg border border-[#E5E5E5] p-6 md:p-8 shadow-sm">

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
              </Alert>
            )}

            <form
              onSubmit={handleSubmit(
                (data) => {
                  onSubmit(data);
                },
                (errors) => {
                  const errorEntries = Object.entries(errors);
                  if (errorEntries.length > 0) {
                    const [fieldName, error] = errorEntries[0];
                    const fieldLabels: Record<string, string> = {
                      category: "Category",
                      subCategory: "Service Name",
                      baseCost: "Base Cost",
                      address: "Address",
                      description: "Description",
                    };
                    const fieldLabel = fieldLabels[fieldName] || fieldName;
                    const errorMsg = error?.message || `${fieldLabel} is required`;
                    setError(`${fieldLabel}: ${errorMsg}`);
                    toast({
                      variant: "destructive",
                      title: "Validation Error",
                      description: `${fieldLabel}: ${errorMsg}`,
                    });
                  }
                }
              )}
              className="space-y-6"
            >
              {/* Hidden duration field */}
              <input type="hidden" {...register("duration")} />

              {/* 2-column grid for desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                  >
                    <option value="">Select Category</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.category.message}
                    </p>
                  )}
                </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Service Name <span className="text-red-500">*</span>
                    </label>
                  <div className="relative">
                    <select
                      {...register("subCategory", { required: "Service name is required" })}
                      disabled={!selectedCategory || !SUB_CATEGORIES[selectedCategory]}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%278%27 viewBox=%270 0 12 8%27 fill=%27none%27%3E%3Cpath d=%27M1 1L6 6L11 1%27 stroke=%27%23666%27 stroke-width=%272%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27/%3E%3C/svg%3E')] bg-no-repeat bg-right-4 pr-10 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{selectedCategory && SUB_CATEGORIES[selectedCategory] ? "Select Service Name" : "Select Category First"}</option>
                      {selectedCategory && SUB_CATEGORIES[selectedCategory] && SUB_CATEGORIES[selectedCategory].map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                  </div>
              </div>
                  {errors.subCategory && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subCategory.message}
                    </p>
                  )}
                </div>
                </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Base Cost ($) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
                    <input
                      {...register("baseCost", {
                        valueAsNumber: true,
                        required: "Base cost is required",
                        min: { value: 0, message: "Base cost must be 0 or greater" },
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                      placeholder="50.00"
                    />
                  </div>
                  {errors.baseCost && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.baseCost.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Duration Field - Set First */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Duration (in minutes) <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <input
                      type="number"
                      min="15"
                      max="180"
                      step="1"
                      value={durationMinutes === "" ? "" : durationMinutes}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          setDurationMinutes("");
                          setDurationError("");
                        } else {
                          const mins = parseInt(value, 10);
                          if (isNaN(mins)) {
                            setDurationMinutes("");
                            setDurationError("");
                          } else if (mins < 15) {
                        setDurationMinutes(mins);
                            setDurationError("Duration must be at least 15 minutes");
                          } else if (mins > 180) {
                            setDurationMinutes(mins);
                            setDurationError("Duration cannot exceed 3 hours (180 minutes)");
                          } else {
                            setDurationMinutes(mins);
                            setDurationError("");
                        // Recalculate end time if start time is set
                        if (newTimeSlot.startTime) {
                          const endTime = calculateEndTime(newTimeSlot.startTime, mins);
                          setNewTimeSlot({ ...newTimeSlot, endTime });
                            }
                          }
                        }
                      }}
                      onBlur={() => {
                        if (durationMinutes === "" || (typeof durationMinutes === "number" && durationMinutes < 15)) {
                          setDurationError("Duration is required and must be at least 15 minutes");
                        } else if (typeof durationMinutes === "number" && durationMinutes > 180) {
                          setDurationError("Duration cannot exceed 3 hours (180 minutes)");
                        } else {
                          setDurationError("");
                        }
                      }}
                      className={`w-full px-4 py-2.5 rounded-lg border ${
                        durationError ? "border-red-500" : "border-[#E5E5E5]"
                      } bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all`}
                      placeholder="Enter duration (e.g., 30)"
                    />
                  </div>
                  <span className="text-sm text-[#888888] whitespace-nowrap">minutes</span>
                  {durationMinutes !== "" && typeof durationMinutes === "number" && durationMinutes >= 15 && (
                    <div className="text-sm text-[#3A3A3A] font-medium whitespace-nowrap">
                    ({formatDuration(durationMinutes)})
                  </div>
                  )}
                </div>
                {durationError && (
                  <p className="text-red-500 text-sm mt-1">
                    {durationError}
                  </p>
                )}
                  <p className="text-xs text-[#888888] mt-1">
                  Minimum 15 minutes, maximum 3 hours (180 minutes). End time will be automatically calculated from start time + duration.
                  </p>
                </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  control={control}
                  name="address"
                  placeholder="123 Main St, City, State ZIP"
                  error={errors.address?.message}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Description <span className="text-[#888888] text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all resize-none"
                  placeholder="Describe your service"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Default Staff Selection */}
              {staff.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-[#E5E5E5]">
                  <label className="block text-sm font-semibold text-[#3A3A3A]">
                    Default Staff for this Service <span className="text-[#888888] text-xs font-normal">(Optional)</span>
                  </label>
                  <p className="text-xs text-[#888888]">
                    Selected staff will be automatically assigned to new time slots. You can change this per slot.
                  </p>
                  <div className="border border-[#E5E5E5] rounded-lg p-3 bg-white space-y-2">
                    {staff.map((member) => (
                      <label key={member.id || member._id} className="flex items-center gap-3 p-2.5 hover:bg-[#F5F5F5] rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={defaultStaffIds.includes(member.id || member._id)}
                          onChange={() => handleToggleStaff(member.id || member._id, true)}
                          className="w-4 h-4 text-[#EECFD1] border-[#E5E5E5] rounded focus:ring-[#EECFD1]"
                        />
                        <div className="flex items-center gap-2.5">
                          {member.photo ? (
                            <Image src={member.photo} alt={member.name} width={28} height={28} className="rounded-full object-cover" />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-[#EECFD1] flex items-center justify-center text-sm font-bold text-[#3A3A3A]">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium text-[#3A3A3A]">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates and Time Slots Section */}
              <div className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                  <div className="flex items-center justify-between mb-4">
                  <label className="block text-base font-bold text-[#3A3A3A]">
                    Dates & Time Slots <span className="text-red-500">*</span>
                      </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setShowTimeSlotForm(true);
                          if (!selectedDate) {
                            setShowDatePicker(true);
                          }
                        }}
                        variant="outline"
                        className="h-9 px-4 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-sm font-medium text-[#3A3A3A] transition-colors"
                      >
                        + Add Time Slot
                      </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      variant="outline"
                      className="h-9 px-4 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-sm font-medium text-[#3A3A3A] transition-colors"
                    >
                      + Add Date
                    </Button>
                    </div>
                </div>

                {/* Date Picker Modal */}
                {showDatePicker && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#3A3A3A]">Select Date</h3>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-[#888888] hover:text-[#3A3A3A] hover:bg-[#F5F5F5] transition-colors"
                          aria-label="Close"
                        >
                          ×
                        </button>
                      </div>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleSelectDate(e.target.value);
                          }
                        }}
                        className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                        autoFocus
                      />
                      <p className="text-xs text-[#888888] mt-2">
                        Select a date to add time slots
                      </p>
                    </div>
                  </div>
                )}

                {/* Time Slot Form - Always visible but disabled until date is selected */}
                {showTimeSlotForm && (
                  <div className="bg-white rounded-2xl p-6 md:p-8 space-y-6 border border-gray-100 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-[#3A3A3A]">
                          {selectedDate ? `Add Time Slot` : "Add Time Slot"}
                      </h3>
                        {selectedDate && (
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(selectedDate).toLocaleDateString("en-GB", {
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                              weekday: "long"
                            })}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setShowTimeSlotForm(false);
                          setSelectedDate("");
                        }}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#3A3A3A] hover:bg-gray-100 transition-colors"
                        aria-label="Close"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Time Selection - Clean and Professional */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-[#3A3A3A]">
                          Start Time <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-3">
                          {/* Unified Time Picker */}
                          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
                            <div className="flex-1 relative">
                              <select
                                value={startHour}
                                onChange={(e) => {
                                  setStartHour(e.target.value);
                                  setNewTimeSlot({ ...newTimeSlot, startTime: "", endTime: "" });
                                }}
                                disabled={!selectedDate}
                                className="w-full px-4 py-3 pr-8 bg-transparent border-0 text-[#3A3A3A] font-medium text-base focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                              >
                                <option value="">--</option>
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                                  <option key={h} value={String(h)}>{String(h).padStart(2, '0')}</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                      </div>
                            </div>
                            <span className="text-[#3A3A3A] font-semibold text-lg">:</span>
                            <div className="flex-1 relative">
                              <select
                                value={startMinute}
                                onChange={(e) => {
                                  setStartMinute(e.target.value);
                                  setNewTimeSlot({ ...newTimeSlot, startTime: "", endTime: "" });
                                }}
                                disabled={!selectedDate || !startHour}
                                className="w-full px-4 py-3 pr-8 bg-transparent border-0 text-[#3A3A3A] font-medium text-base focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
                              >
                                {Array.from({ length: 12 }, (_, i) => {
                                  const minute = String(i * 5).padStart(2, '0');
                                  return <option key={minute} value={minute}>{minute}</option>;
                                })}
                              </select>
                              <div className="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                            <div className="flex gap-1 bg-white rounded-lg p-1 border border-gray-200">
                              <button
                                type="button"
                                onClick={() => {
                                  setStartPeriod("AM");
                                  setNewTimeSlot({ ...newTimeSlot, startTime: "", endTime: "" });
                                }}
                                disabled={!selectedDate || !startHour}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                  startPeriod === "AM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                AM
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setStartPeriod("PM");
                                  setNewTimeSlot({ ...newTimeSlot, startTime: "", endTime: "" });
                                }}
                                disabled={!selectedDate || !startHour}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                  startPeriod === "PM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                PM
                              </button>
                            </div>
                      </div>
                    </div>

                        {/* End Time Display - Elegant */}
                        {newTimeSlot.endTime && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-gray-500">Ends at</span>
                            <span className="font-semibold text-[#3A3A3A] px-3 py-1.5 bg-[#EECFD1]/10 rounded-lg">
                              {formatTime12Hour(newTimeSlot.endTime)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#3A3A3A]">Assign Staff <span className="text-[#888888] text-xs font-normal">(Optional)</span></label>
                      <div className={`border border-[#E5E5E5] rounded-lg p-3 bg-white max-h-40 overflow-y-auto space-y-2 ${!selectedDate ? 'opacity-60 pointer-events-none' : ''}`}>
                        {staff.length > 0 ? (
                          staff.map((member) => (
                            <label key={member.id || member._id} className="flex items-center gap-2.5 p-2.5 hover:bg-[#F5F5F5] rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                checked={newTimeSlot.staffIds.includes(member.id || member._id)}
                                onChange={() => handleToggleStaff(member.id || member._id, false)}
                                disabled={!selectedDate}
                                className="w-4 h-4 text-[#EECFD1] border-[#E5E5E5] rounded focus:ring-[#EECFD1] disabled:cursor-not-allowed"
                              />
                              <div className="flex items-center gap-2.5">
                                {member.photo ? (
                                  <Image src={member.photo} alt={member.name} width={24} height={24} className="rounded-full object-cover" />
                                ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#EECFD1] flex items-center justify-center text-xs font-bold text-[#3A3A3A]">
                                    {member.name.charAt(0)}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-[#3A3A3A]">{member.name}</span>
                              </div>
                            </label>
                          ))
                        ) : (
                          <p className="text-sm text-[#888888] text-center py-2">No staff members available</p>
                        )}
                        </div>
                      </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleAddTimeSlot}
                        variant="pink"
                        disabled={!selectedDate}
                        className="flex-1 h-10 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add Time Slot
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          setShowTimeSlotForm(false);
                          setSelectedDate("");
                        }}
                        variant="outline"
                        className="h-10 px-6 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#3A3A3A] font-medium transition-colors"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Dates with Time Slots - Grouped Display */}
                {Object.keys(datesWithSlots).length > 0 ? (
                  <div className="space-y-4">
                    {Object.entries(datesWithSlots)
                      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                      .map(([date, slots]) => (
                        <div key={date} className="bg-white rounded-lg p-5 border border-[#E5E5E5] shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-[#EECFD1]/20 flex items-center justify-center">
                                <span className="text-lg">📅</span>
                              </div>
                              <div>
                                <h4 className="font-bold text-base text-[#3A3A3A]">
                                  {new Date(date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })}
                                </h4>
                                <p className="text-xs text-[#888888]">
                                  {new Date(date).toLocaleDateString("en-US", { weekday: "long" })} • {new Date(date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => handleSelectDate(date)}
                                variant="outline"
                                className="h-8 px-3 text-xs rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#3A3A3A] font-medium transition-colors"
                              >
                                + Add Slot
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleRemoveDate(date)}
                                variant="outline"
                                className="h-8 px-3 text-xs rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 font-medium transition-colors"
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="space-y-2">
                            {slots.map((slot, index) => {
                              const assignedStaff = staff.filter((s: any) =>
                                slot.staffIds.includes(s.id || s._id)
                              );
                              const slotCost = slot.cost || "Base Cost";
                              const start = new Date(`2000-01-01T${slot.startTime}`);
                              const end = new Date(`2000-01-01T${slot.endTime}`);
                              const durationMs = end.getTime() - start.getTime();
                              const hours = Math.floor(durationMs / (1000 * 60 * 60));
                              const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
                              const duration = hours > 0 ? `${hours}Hr${minutes > 0 ? ` ${minutes}mins` : ''}` : `${minutes}mins`;

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5]"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#3A3A3A]">
                                      {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)} ({duration})
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-[#888888]">
                                      <span>
                                        Cost: {typeof slotCost === 'number' ? `$${slotCost.toFixed(2)}` : String(slotCost)}
                                      </span>
                                      {assignedStaff.length > 0 && (
                                        <span className="text-[#3A3A3A] font-medium">
                                          Staff: {assignedStaff.map((s: any) => s.name).join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlot(date, index)}
                                    variant="outline"
                                    className="h-8 px-3 text-xs rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 font-medium transition-colors"
                                  >
                                    Remove
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#E5E5E5]">
                <Button
                  type="submit"
                  disabled={isLoading || Object.keys(datesWithSlots).length === 0}
                  variant="pink"
                  className="flex-1 h-11 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : (
                    "Create Service"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  className="flex-1 h-11 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#3A3A3A] font-medium transition-colors"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

