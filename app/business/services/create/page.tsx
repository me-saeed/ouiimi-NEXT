"use client";
// Force rebuild

import { useState, useEffect, useCallback } from "react";
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
import { Modal } from "@/components/ui/modal";
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
import { useAuth } from "@/lib/contexts/AuthContext";

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
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    console.log("[Create Service] Component mounted, setting isClient to true");
    setIsClient(true);
  }, []);
  const [businessId, setBusinessId] = useState<string>("");
  const [business, setBusiness] = useState<any>(null);
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

  const loadStaff = useCallback(async () => {
    if (!user) return;

    console.log("[Create Service] loadStaff called for user:", user.id || user._id);

    try {
      const userId = user.id || user._id;
      if (!userId) {
        console.warn("[Create Service] No userId found in loadStaff");
        return;
      }

      console.log("[Create Service] Fetching business for userId:", userId);
      // Find business
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
      });

      console.log("[Create Service] Business API response:", businessResponse.status);

      if (businessResponse.ok) {
        const businessData = await businessResponse.json();
        if (businessData.businesses && businessData.businesses.length > 0) {
          const foundBusiness = businessData.businesses[0];
          const businessId = foundBusiness.id || foundBusiness._id;

          // Save business data to check status
          setBusiness(foundBusiness);

          // Load staff
          const staffResponse = await fetch(`/api/staff?businessId=${businessId}`, {
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Use session cookies
          });

          if (staffResponse.ok) {
            const staffData = await staffResponse.json();
            setStaff(staffData.staff || []);
          }
        }
      }
    } catch (err) {
      console.error("[Create Service] Failed to load staff:", err);
    }
  }, [user]);

  // Check authentication and load data
  useEffect(() => {
    if (!isClient || authLoading) return;

    if (!isAuthenticated || !user) {
      console.warn("[Create Service] Not authenticated, redirecting to signin");
      router.push("/signin?redirect=/business/services/create");
      return;
    }

    console.log("[Create Service] User authenticated, loading staff");
    loadStaff();
  }, [isClient, authLoading, isAuthenticated, user, router, loadStaff]);

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

    // ✅ NEW: Check for duplicate time slot on the same date
    const existingSlots: Array<{
      startTime: string;
      endTime: string;
      price: number;
      duration: number;
      staffIds: string[];
      addOns: Array<{ name: string; cost: number }>;
    }> = datesWithSlots[selectedDate] || [];

    const isDuplicate = existingSlots.some(
      (slot) => slot.startTime === newTimeSlot.startTime && slot.endTime === newTimeSlot.endTime
    );

    if (isDuplicate) {
      setError(
        `This time slot (${formatTime12Hour(newTimeSlot.startTime)} - ${formatTime12Hour(newTimeSlot.endTime)}) already exists for this date. Please select a different time.`
      );
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
      // Get user data from session
      if (!user) {
        setError("Please sign in to create a service");
        setIsLoading(false);
        router.push("/signin?redirect=/business/services/create");
        return;
      }

      const userId = user.id || user._id;

      if (!userId) {
        setError("User ID not found. Please sign in again.");
        setIsLoading(false);
        return;
      }
      // First, find the business for this user
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Use session cookies
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
        },
        credentials: "include", // Use session cookies
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

  console.log("[Create Service] Rendering form - user:", user?.email || user?.id);

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font bold text-[#3A3A3A] mb-2">
              Create Service
            </h1>
            <p className="text-[#888888]">
              Add a new service to your business
            </p>
          </div>

          {/* Business Approval Status Check */}
          {business && business.status !== 'approved' && (
            <div className="bg-white rounded-xl border border-[#E5E5E5] p-6 md:p-8 shadow-sm">
              <Alert className={`border-2 ${business.status === 'pending' ? 'border-amber-300 bg-amber-50' :
                business.status === 'rejected' ? 'border-red-300 bg-red-50' :
                  'border-gray-300 bg-gray-50'
                }`}>
                <AlertDescription className="text-center space-y-4">
                  <div className="text-4xl">
                    {business.status === 'pending' && '⏳'}
                    {business.status === 'rejected' && '❌'}
                    {business.status === 'suspended' && '🚫'}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold mb-2 ${business.status === 'pending' ? 'text-amber-800' :
                      business.status === 'rejected' ? 'text-red-800' :
                        'text-gray-800'
                      }`}>
                      {business.status === 'pending' && 'Business Account Pending Approval'}
                      {business.status === 'rejected' && 'Business Account Rejected'}
                      {business.status === 'suspended' && 'Business Account Suspended'}
                    </h3>
                    <p className={`${business.status === 'pending' ? 'text-amber-700' :
                      business.status === 'rejected' ? 'text-red-700' :
                        'text-gray-700'
                      }`}>
                      {business.status === 'pending' &&
                        'Your business account is currently under review by our admin team. You can view your dashboard but cannot create services until your account is approved. You will receive an email once your account is approved.'
                      }
                      {business.status === 'rejected' &&
                        `Your business account has been rejected. ${business.adminNotes ? `Reason: ${business.adminNotes}` : 'Please contact support for more information.'}`
                      }
                      {business.status === 'suspended' &&
                        `Your business account has been suspended. ${business.adminNotes ? `Reason: ${business.adminNotes}` : 'Please contact support for more information.'}`
                      }
                    </p>
                  </div>
                  <Button
                    onClick={() => router.push('/business/dashboard')}
                    className="mt-4"
                  >
                    Go to Dashboard
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Form Card - Only show if approved */}
          {(!business || business.status === 'approved') && (
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
                      <SelectTrigger className="w-full h-10 md:h-[46px] px-3 md:px-4 rounded-xl border-gray-200 bg-white focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1] text-sm md:text-base text-[#3A3A3A] font-normal shadow-sm hover:border-[#EECFD1] transition-all">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px] md:max-h-[300px]">
                        {CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat} className="cursor-pointer py-2 md:py-3 text-sm md:text-base hover:bg-[#FFF5F6] hover:text-[#3A3A3A] focus:bg-[#FFF5F6] focus:text-[#3A3A3A]">
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
                      <SelectTrigger className={`w-full h-10 md:h-[46px] px-3 md:px-4 rounded-xl border-gray-200 shadow-sm transition-all text-sm md:text-base text-[#3A3A3A] font-normal ${!selectedCategory ? "bg-gray-50 cursor-not-allowed opacity-75" : "bg-white hover:border-[#EECFD1] focus:ring-2 focus:ring-[#EECFD1]/50 focus:border-[#EECFD1]"}`}>
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

                {/* Stacked Layout for Dates & Slots */}
                <div className="space-y-6 pt-6 border-t border-[#E5E5E5]">
                  {/* Toolbar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="space-y-1">
                      <h3 className="text-xs md:text-sm font-bold text-[#3A3A3A] uppercase tracking-wider">Availability</h3>
                      <p className="text-[10px] md:text-xs text-gray-500">Manage dates and time slots for this service.</p>
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

                      {/* Desktop: Button with showPicker */}
                      <Button
                        type="button"
                        variant="outline"
                        className="hidden md:flex h-9 gap-2 text-xs font-semibold rounded-lg border-gray-200 hover:bg-gray-50 hover:text-[#3A3A3A]"
                        onClick={() => {
                          const picker = document.getElementById('hidden-date-picker-create');
                          if (picker) {
                            // Feature detection for showPicker support
                            if ('showPicker' in HTMLInputElement.prototype) {
                              try {
                                (picker as HTMLInputElement).showPicker();
                              } catch (err) {
                                // Fallback to click if showPicker fails
                                picker.click();
                              }
                            } else {
                              // Fallback for browsers without showPicker
                              picker.click();
                            }
                          }
                        }}
                      >
                        <span className="text-lg leading-none">+</span> Add Date
                      </Button>

                      {/* Hidden input for desktop */}
                      <input
                        id="hidden-date-picker-create"
                        type="date"
                        className="hidden md:block absolute inset-0 opacity-0 w-full h-full cursor-pointer"
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
                                          onClick={() => handleRemoveTimeSlot(date, index)}
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
                    {/* Error Display */}
                    {error && error.includes("conflicts") && (
                      <div className="text-xs font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-100 flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
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
                          <p className="text-xs text-gray-400 italic text-center">No add-ons available for this category.</p>
                        )}
                      </div>

                      <div className="pt-2">
                        <Button
                          onClick={handleAddTimeSlot}
                          className="w-full bg-[#3A3A3A] hover:bg-black text-white h-12 rounded-xl text-base font-bold shadow-lg shadow-gray-200/50 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        >
                          Save Time Slot
                        </Button>
                      </div>
                    </div>
                  </div>
                </Modal>

                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-[#E5E5E5]">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    variant="pink"
                    className="flex-1 h-10 md:h-11 rounded-lg text-sm md:text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleSubmit(onSubmit, (errors) => {
                      console.log("Form validation errors:", errors);
                      // Toast for form validation errors
                      const missingFields = Object.keys(errors).map(key => {
                        if (key === 'category') return 'Category';
                        if (key === 'subCategory') return 'Service Name';
                        if (key === 'address') return 'Address';
                        if (key === 'description') return 'Description';
                        // Helper for other fields
                        return key.charAt(0).toUpperCase() + key.slice(1);
                      });

                      toast({
                        variant: "destructive",
                        title: "Missing Required Fields",
                        description: `Please fill in: ${missingFields.join(', ')}`,
                      });
                    })}
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
                    className="flex-1 h-10 md:h-11 rounded-lg border border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-sm md:text-base text-[#3A3A3A] font-medium transition-colors"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

