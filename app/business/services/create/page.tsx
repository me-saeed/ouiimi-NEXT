"use client";
// Force rebuild

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
import { TimeSelect } from "@/components/ui/time-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { getAllCategories, getAddOnsByCategory } from "@/lib/constants/categories";

// Get all category names
const CATEGORIES = getAllCategories().map(cat => cat.name);

// Build subcategories dynamically from constants
const SUB_CATEGORIES: Record<string, string[]> = {};
getAllCategories().forEach(category => {
  const subs = category.subcategories.map(sub => sub.name);
  SUB_CATEGORIES[category.name] = subs.length > 0 ? subs : [];
});

// Add-ons are now dynamically loaded from category data


export default function CreateServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("[Create Service] Component mounted, setting isClient to true");
    setIsClient(true);
  }, []);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);

  const [duration, setDuration] = useState<number>(30); // Default 30 mins
  // Group time slots by date: { "2025-10-30": [{ startTime, endTime, price, duration, staffIds, addOns }] }
  const [datesWithSlots, setDatesWithSlots] = useState<Record<string, Array<{
    startTime: string;
    endTime: string;
    price: number;
    duration: number;
    staffIds: string[];
    addOns: Array<{ name: string; cost: number }>;
  }>>>({});
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimeSlotForm, setShowTimeSlotForm] = useState(false);
  const [newTimeSlot, setNewTimeSlot] = useState({
    startTime: "",
    endTime: "",
    price: "" as string | number,
    staffIds: [] as string[],
  });


  // Add-ons state
  const [selectedAddOns, setSelectedAddOns] = useState<Array<{ name: string; cost: number }>>([]);
  const [isAddOnsDropdownOpen, setIsAddOnsDropdownOpen] = useState(false);

  // Form schema without businessId (we add it dynamically)
  // Make serviceName optional since we use subCategory instead, and make subCategory required
  // Remove baseCost and duration from schema since they're no longer needed
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
    // Reset subCategory and addOns when category changes
    if (selectedCategory) {
      setValue("subCategory", "");
      setSelectedAddOns([]);
    }
  }, [selectedCategory, setValue]);

  // Reset addOns when subCategory changes
  const selectedSubCategory = watch("subCategory");
  useEffect(() => {
    setSelectedAddOns([]);
  }, [selectedSubCategory]);


  useEffect(() => {
    if (!isClient || typeof window === 'undefined') {
      console.log("[Create Service] Waiting for client-side hydration...");
      return;
    }

    console.log("[Create Service] Client-side ready, loading user data...");
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");

    if (token && userData) {
      try {
        const parsedUser = typeof userData === 'string' ? JSON.parse(userData) : userData;
        if (parsedUser && typeof parsedUser === 'object') {
          console.log("[Create Service] User data loaded:", parsedUser.email || parsedUser.username);
          setUser(parsedUser);
          loadStaff(parsedUser);
        } else {
          console.warn("[Create Service] Invalid user data format, redirecting to signin");
          router.push("/signin");
        }
      } catch (e) {
        console.error("[Create Service] Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      console.warn("[Create Service] No token or user data found, redirecting to signin");
      router.push("/signin");
    }
  }, [router, isClient]);

  const loadStaff = async (userData: any) => {
    if (typeof window === 'undefined') return;

    console.log("[Create Service] loadStaff called for user:", userData?.id || userData?._id);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("[Create Service] No token found in loadStaff");
        return;
      }

      const userId = userData?.id || userData?._id;
      if (!userId) {
        console.warn("[Create Service] No userId found in loadStaff");
        return;
      }

      console.log("[Create Service] Fetching business for userId:", userId);
      // Find business
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("[Create Service] Business API response:", businessResponse.status);

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


  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowTimeSlotForm(true);
    // Initialize with defaults: 09:00 to 10:00 (60 mins)
    setNewTimeSlot({
      startTime: "09:00",
      endTime: "10:00",
      price: "",
      staffIds: [],
    });
    setDuration(60);
    setSelectedAddOns([]);
    setError("");
    setSuccess("");
  };

  // Check for time conflicts (overlapping time ranges)
  const checkTimeConflict = (startTime24: string, endTime24: string, staffIds: string[]): boolean => {
    if (!selectedDate || !startTime24 || !endTime24) return false;
    if (staffIds.length === 0) return false; // Cannot check for conflicts without assigned staff

    const existingSlots = datesWithSlots[selectedDate] || [];
    const start = new Date(`2000-01-01T${startTime24}`);
    const end = new Date(`2000-01-01T${endTime24}`);

    return existingSlots.some((existingSlot: any) => {
      const existingStart = new Date(`2000-01-01T${existingSlot.startTime}`);
      const existingEnd = new Date(`2000-01-01T${existingSlot.endTime}`);
      const existingStaff = (existingSlot.staffIds || []).sort();
      const selectedStaff = staffIds.sort();

      // Check if staff overlap
      const staffOverlap = selectedStaff.some(id => existingStaff.includes(id));

      if (!staffOverlap) return false;

      // Check if time ranges overlap
      return (start < existingEnd && end > existingStart);
    });
  };

  // Calculate end time from start time and duration minutes
  const calculateEndTimeFromDuration = (startTime: string, durationMins: number): string => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMins * 60000);

    const endHours = String(endDate.getHours()).padStart(2, "0");
    const endMinutes = String(endDate.getMinutes()).padStart(2, "0");
    return `${endHours}:${endMinutes}`;
  };

  // Handler for Start Time Change
  const handleStartTimeChange = (newStartTime: string) => {
    // When Start Time changes, we keep Duration constant -> Change End Time
    // Unless we don't have a valid duration yet (e.g. initial), then maybe we keep end time? 
    // Plan: Use current duration state to calculate new end time.

    // Calculate new end time based on current duration
    const newEndTime = calculateEndTimeFromDuration(newStartTime, duration);

    setNewTimeSlot(prev => ({
      ...prev,
      startTime: newStartTime,
      endTime: newEndTime
    }));
  };

  // Handler for End Time Change
  const handleEndTimeChange = (newEndTime: string) => {
    // When End Time changes, we keep Start Time constant -> Change Duration
    if (!newTimeSlot.startTime) {
      // If no start time, just set end time
      setNewTimeSlot(prev => ({ ...prev, endTime: newEndTime }));
      return;
    }

    const newDuration = calculateDuration(newTimeSlot.startTime, newEndTime);

    setNewTimeSlot(prev => ({
      ...prev,
      endTime: newEndTime
    }));
    setDuration(newDuration);
  };

  // Effect to check for conflicts when time changes
  useEffect(() => {
    if (newTimeSlot.startTime && newTimeSlot.endTime && selectedDate) {
      const selectedStaffIds = newTimeSlot.staffIds;
      if (selectedStaffIds.length > 0) {
        const hasConflict = checkTimeConflict(newTimeSlot.startTime, newTimeSlot.endTime, selectedStaffIds);
        if (hasConflict) {
          setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
        } else {
          // Clear only if it was a conflict error
          if (error && error.includes("conflicts")) setError("");
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTimeSlot.startTime, newTimeSlot.endTime, duration]);



  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTimeSlot.startTime) {
      setError("Please select a date and start time");
      return;
    }

    if (!newTimeSlot.endTime) {
      setError("End time is required");
      return;
    }

    // Validate price
    if (!newTimeSlot.price || newTimeSlot.price === "" || (typeof newTimeSlot.price === 'number' && newTimeSlot.price <= 0)) {
      setError("Price is required for this time slot");
      return;
    }

    // Calculate duration
    const duration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
    if (duration <= 0) {
      setError("End time must be after start time");
      return;
    }

    // Validate staff assignment
    const finalStaffIds = newTimeSlot.staffIds;
    if (finalStaffIds.length === 0) {
      setError("Please assign at least one staff member to this time slot");
      return;
    }

    // Final check for conflicts (in case staff was changed after time selection)
    const slot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      price: typeof newTimeSlot.price === "number" ? newTimeSlot.price : parseFloat(String(newTimeSlot.price)),
      duration,
      staffIds: finalStaffIds,
      addOns: [...selectedAddOns], // Copy current add-ons
    };

    const hasConflict = checkTimeConflict(slot.startTime, slot.endTime, slot.staffIds);

    if (hasConflict) {
      setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
      return;
    }

    // Add slot to the selected date
    const existingSlots: Array<{
      startTime: string;
      endTime: string;
      price: number;
      duration: number;
      staffIds: string[];
      addOns: Array<{ name: string; cost: number }>;
    }> = datesWithSlots[selectedDate] || [];
    setDatesWithSlots({
      ...datesWithSlots,
      [selectedDate]: [...existingSlots, slot],
    });

    // Reset form but keep date selected and default staff
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      price: "",
      staffIds: [],
    });
    setDuration(60); // Reset to default 60
    setSelectedAddOns([]); // Reset add-ons
    setError("");

    // Close the time slot form modal
    setShowTimeSlotForm(false);

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

  const handleToggleStaff = (staffId: string) => {
    setNewTimeSlot({
      ...newTimeSlot,
      staffIds: newTimeSlot.staffIds.includes(staffId)
        ? newTimeSlot.staffIds.filter(id => id !== staffId)
        : [...newTimeSlot.staffIds, staffId],
    });
  };

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

  // Calculate duration in minutes from start and end time
  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 0;
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    let duration = endTotal - startTotal;
    // Handle case where end time is next day (e.g., 23:00 to 01:00)
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours
    }
    return duration > 0 ? duration : 0;
  };

  // Convert duration minutes to string format
  const formatDuration = (minutes: number | ""): string => {
    if (minutes === "" || typeof minutes !== "number" || minutes === 0) return "";
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
      price: number;
      duration: number; // Calculated duration in minutes
      staffIds: string[];
      addOns?: Array<{ name: string; cost: number }>;
    }> = [];
    Object.entries(datesWithSlots).forEach(([date, timeSlots]) => {
      timeSlots.forEach(slot => {
        // Calculate duration from start and end time
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

      let parsedUser;
      try {
        parsedUser = typeof userData === 'string' ? JSON.parse(userData) : userData;
        if (!parsedUser || typeof parsedUser !== 'object') {
          setError("Invalid user data. Please sign in again.");
          setIsLoading(false);
          router.push("/signin");
          return;
        }
      } catch (e) {
        setError("Error parsing user data. Please sign in again.");
        setIsLoading(false);
        router.push("/signin");
        return;
      }

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

      // Validate that at least one time slot exists
      const timeSlotsForSubmission = getTimeSlotsForSubmission();
      if (timeSlotsForSubmission.length === 0) {
        setError("Please add at least one time slot");
        setIsLoading(false);
        return;
      }

      // Validate all time slots have price
      const slotsWithoutPrice = timeSlotsForSubmission.filter(slot => !slot.price || slot.price === 0 || typeof slot.price !== 'number');
      if (slotsWithoutPrice.length > 0) {
        setError("All time slots must have a price");
        setIsLoading(false);
        return;
      }

      // Collect all unique add-ons from all time slots for service-level addOns
      const allAddOnsMap = new Map<string, { name: string; cost: number }>();
      timeSlotsForSubmission.forEach(slot => {
        if (slot.addOns && Array.isArray(slot.addOns)) {
          slot.addOns.forEach(addon => {
            if (addon && addon.name) {
              // Use name as key to avoid duplicates, keep the first cost encountered
              if (!allAddOnsMap.has(addon.name)) {
                allAddOnsMap.set(addon.name, { name: addon.name, cost: addon.cost || 0 });
              }
            }
          });
        }
      });
      const serviceAddOns = Array.from(allAddOnsMap.values());

      // Ensure all data is serializable
      const requestBody = {
        category: data.category,
        subCategory: data.subCategory,
        serviceName: data.subCategory, // Use subCategory as serviceName
        description: data.description || "",
        address: data.address,
        businessId: foundBusinessId,

        addOns: serviceAddOns, // ✅ FIXED: Include ALL unique add-ons from all time slots
        timeSlots: timeSlotsForSubmission.map(slot => ({
          date: typeof slot.date === 'string' ? slot.date : new Date(slot.date).toISOString().split('T')[0],
          startTime: String(slot.startTime),
          endTime: String(slot.endTime),
          price: Number(slot.price), // Required price for this time slot
          duration: Number(slot.duration), // Calculated duration in minutes
          staffIds: (slot.staffIds || []).map(id => String(id)),
          addOns: slot.addOns || [], // Include add-ons for this specific slot
        })),
      };

      console.log("[Create Service] Sending request to /api/services");
      console.time("[Create Service] API Request");

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.timeEnd("[Create Service] API Request");
      console.log("[Create Service] Response status:", response.status);

      let result;
      try {
        const responseText = await response.text();
        if (!responseText) {
          throw new Error("Empty response from server");
        }
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        setError("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

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

  if (!isClient) {
    console.log("[Create Service] Rendering loading state - waiting for client hydration");
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
              <p className="mt-4 text-gray-600">Initializing...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user) {
    console.log("[Create Service] Rendering loading state - waiting for user data");
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
              <p className="mt-4 text-gray-600">Loading user data...</p>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  console.log("[Create Service] Rendering form - user:", user.email || user.username);

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
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
          <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 md:p-8 shadow-sm">

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

              {/* 2-column grid for desktop */}
              {/* 2-column grid for desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={selectedCategory}
                    onValueChange={(val) => setValue("category", val)}
                  >
                    <SelectTrigger className="w-full h-[46px] px-4 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1] text-[#3A3A3A] font-normal shadow-sm hover:border-[#EECFD1] transition-all">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat} className="cursor-pointer py-3 hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                  <Select
                    value={watch("subCategory")}
                    onValueChange={(val) => setValue("subCategory", val)}
                    disabled={!selectedCategory || !SUB_CATEGORIES[selectedCategory]}
                  >
                    <SelectTrigger className={`w-full h-[46px] px-4 rounded-xl border-gray-200 shadow-sm transition-all text-[#3A3A3A] font-normal ${!selectedCategory ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white hover:border-[#EECFD1] focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1]"}`}>
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
                  {errors.subCategory && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.subCategory.message}
                    </p>
                  )}
                </div>
              </div>


              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <AddressAutocomplete
                  control={control}
                  name="address"
                  placeholder="123 Main St, City, State ZIP"
                  error={errors.address?.message || (errors.address as any)?.street?.message}
                  required
                  returnObject={true}
                  setValue={setValue}
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Description <span className="text-[#888888] text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E5E5E5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all resize-none"
                  placeholder="Describe your service"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Dates and Time Slots Section - Master-Detail Layout */}
              <div className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-base font-bold text-[#3A3A3A]">
                    Dates & Time Slots <span className="text-red-500">*</span>
                  </label>
                  {/* Global Add Date Button (Mobile mostly) */}
                  <div className="md:hidden">
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

                {/* Master-Detail Container */}
                <div className="flex flex-col md:flex-row h-[600px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">

                  {/* LEFT PANEL: Date List */}
                  <div className="w-full md:w-1/3 border-r border-gray-100 bg-gray-50/50 flex flex-col">
                    <div className="p-4 border-b border-gray-100 bg-white sticky top-0 z-10">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-bold text-[#3A3A3A]">Dates</h4>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowDatePicker(true)}
                          className="h-8 text-xs bg-[#3A3A3A] hover:bg-black text-white rounded-lg shadow-none"
                        >
                          + Add Date
                        </Button>
                      </div>

                      {/* Date Picker Input (Inline-ish) */}
                      {showDatePicker && (
                        <div className="absolute top-14 left-4 right-4 z-20 bg-white p-3 rounded-xl shadow-xl border border-gray-100 animate-in fade-in zoom-in-95">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-semibold text-gray-700">Select Date</span>
                            <button type="button" onClick={() => setShowDatePicker(false)} className="text-gray-400 hover:text-gray-600">✕</button>
                          </div>
                          <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleSelectDate(e.target.value);
                                setShowDatePicker(false);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-[#EECFD1]"
                            autoFocus
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar">
                      {Object.keys(datesWithSlots).length === 0 ? (
                        <div className="text-center py-10 px-4 text-gray-400 text-xs italic">
                          No dates added.<br />Use the button above to add a date.
                        </div>
                      ) : (
                        Object.keys(datesWithSlots)
                          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
                          .map((date) => {
                            const slotCount = datesWithSlots[date]?.length || 0;
                            const isSelected = selectedDate === date;
                            return (
                              <div
                                key={date}
                                onClick={() => {
                                  setSelectedDate(date);
                                  setShowTimeSlotForm(false);
                                }}
                                className={`p-3 rounded-xl cursor-pointer transition-all border group relative ${isSelected
                                    ? 'bg-white border-[#EECFD1] shadow-md ring-1 ring-[#EECFD1]/30'
                                    : 'bg-white border-transparent hover:border-gray-200 hover:shadow-sm'
                                  }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-bold text-[#3A3A3A] text-sm">
                                      {new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                    </div>
                                    <div className="text-xs text-gray-500 capitalize">
                                      {new Date(date).toLocaleDateString('en-US', { weekday: 'long' })}
                                    </div>
                                  </div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${slotCount > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {slotCount} Slots
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRemoveDate(date);
                                  }}
                                  className="absolute bottom-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                  title="Remove Date"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* RIGHT PANEL: Slots for Selected Date */}
                  <div className="w-full md:w-2/3 bg-white flex flex-col h-full relative">
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

                              {/* Start/End Time */}
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <TimeSelect
                                  label="Start"
                                  value={newTimeSlot.startTime}
                                  onChange={handleStartTimeChange}
                                  required
                                />
                                <TimeSelect
                                  label="End"
                                  value={newTimeSlot.endTime}
                                  onChange={handleEndTimeChange}
                                  required
                                />
                              </div>

                              {/* Price */}
                              <div className="grid grid-cols-1 mb-4">
                                <label className="block text-xs font-semibold text-gray-700 mb-1">Price ($)</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={newTimeSlot.price === "" ? "" : newTimeSlot.price}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      if (value === "") {
                                        setNewTimeSlot({ ...newTimeSlot, price: "" });
                                      } else {
                                        const price = parseFloat(value);
                                        if (!isNaN(price) && price >= 0) {
                                          setNewTimeSlot({ ...newTimeSlot, price });
                                        }
                                      }
                                    }}
                                    className="w-full pl-6 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#EECFD1]"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              {/* Add-Ons Section (Newly Added) */}
                              <div className="space-y-3 pt-3 border-t border-gray-200 mb-4">
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
                                  <div className="p-3 bg-white rounded-lg border border-gray-200 mb-3">
                                    <p className="text-xs text-gray-500 mb-2">Select available add-ons:</p>
                                    <div className="flex flex-wrap gap-2">
                                      {selectedCategory && getAddOnsByCategory(selectedCategory).map((addOnName, idx) => {
                                        const existingAddOn = selectedAddOns.find(a => a.name === addOnName);
                                        const isSelected = !!existingAddOn;
                                        return (
                                          <div key={idx} className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 pr-2 border border-gray-100">
                                            <button
                                              type="button"
                                              onClick={() => handleToggleAddOn({ name: addOnName, cost: 0 })}
                                              className={`px-2 py-1 rounded text-xs transition-colors border ${isSelected
                                                ? "bg-[#3A3A3A] text-white border-[#3A3A3A]"
                                                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"}`}
                                            >
                                              {addOnName}
                                            </button>
                                            {isSelected && (
                                              <div className="flex items-center gap-0.5">
                                                <span className="text-xs text-gray-400">$</span>
                                                <input
                                                  type="number"
                                                  min="0"
                                                  step="0.01"
                                                  className="w-12 text-xs p-1 border rounded"
                                                  placeholder="0"
                                                  value={existingAddOn?.cost || ''}
                                                  onChange={(e) => {
                                                    const val = parseFloat(e.target.value) || 0;
                                                    setSelectedAddOns(prev => prev.map(p => p.name === addOnName ? { ...p, cost: val } : p));
                                                  }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                      {(!selectedCategory || getAddOnsByCategory(selectedCategory).length === 0) && (
                                        <span className="text-xs text-gray-400 italic">No add-ons available.</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Staff */}
                              <div className="mb-4">
                                <label className="block text-xs font-semibold text-gray-700 mb-2">Assign Staff</label>
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
                                Add Time Slot
                              </Button>
                            </div>
                          )}

                          {/* Slot List */}
                          <div className="space-y-3">
                            {(datesWithSlots[selectedDate] || []).map((slot, index) => {
                              const assignedStaff = staff.filter((s: any) => slot.staffIds.includes(s.id || s._id));
                              return (
                                <div key={index} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-[#EECFD1] hover:shadow-md transition-all group">
                                  <div className="flex items-center gap-4">
                                    <div className="bg-[#FFF5F6] px-4 py-2.5 rounded-xl text-base font-bold text-[#3A3A3A] border border-[#ffebed] whitespace-nowrap">
                                      {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-base font-bold text-gray-800">${typeof slot.price === 'number' ? slot.price.toFixed(2) : slot.price}</span>
                                      {assignedStaff.length > 0 && (
                                        <span className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                          Staff: {assignedStaff.map((s: any) => s.name?.split(' ')[0]).join(', ')}
                                        </span>
                                      )}
                                      {slot.addOns && slot.addOns.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {slot.addOns.map((addon, aIdx) => (
                                            <span key={aIdx} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                                              {addon.name} (+${addon.cost})
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlot(selectedDate, index)}
                                    className="text-gray-300 hover:text-red-500 p-2 rounded-lg transition-colors opacity-0 group-hover:opacity-100 bg-gray-50 hover:bg-red-50"
                                  >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                  </button>
                                </div>
                              );
                            })}
                            {(datesWithSlots[selectedDate] || []).length === 0 && !showTimeSlotForm && (
                              <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                                <p className="text-sm">No slots for this date yet.</p>
                                <Button variant="link" onClick={() => setShowTimeSlotForm(true)} className="text-[#EECFD1]">Add First Slot</Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400 bg-gray-50/50">
                        <span className="text-4xl mb-2">👈</span>
                        <p>Select a date to manage slots</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#E5E5E5]">
                <Button
                  type="submit"
                  disabled={isLoading || Object.keys(datesWithSlots).length === 0}
                  variant="pink"
                  className="flex-1 h-11 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </div>
                  ) : (
                    "Create Service"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.push("/business/dashboard")}
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

