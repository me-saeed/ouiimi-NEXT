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
import { TimePickerWheel } from "@/components/ui/time-picker-wheel";
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

const SUB_CATEGORY_ADDONS: Record<string, Array<{ name: string; cost: number }>> = {
  // Hair Services Add-Ons
  "Haircut": [
    { name: "Scalp Massage", cost: 30 },
    { name: "Hydration/Repair", cost: 10 },
    { name: "Toner", cost: 20 },
    { name: "Extra Blow-Dry", cost: 50 },
  ],
  "Colouring": [
    { name: "Extra Colour Bowl", cost: 30 },
    { name: "Root Shadow/Blend", cost: 40 },
    { name: "Gloss Refresh", cost: 40 },
    { name: "Colour Lock Treatment", cost: 25 },
  ],
  "Blow-Dry & Styling": [
    { name: "Hot Tool Styling", cost: 20 },
    { name: "Braiding", cost: 30 },
    { name: "Occasion Finish", cost: 40 },
  ],
  "Treatment": [
    { name: "Scalp Massage", cost: 30 },
    { name: "Deep Conditioning", cost: 20 },
  ],
  "Extensions": [
    { name: "Cut & Blend", cost: 50 },
    { name: "Style Finish", cost: 30 },
  ],
  "Men's Cut": [
    { name: "Beard Trim", cost: 15 },
    { name: "Scalp Massage", cost: 20 },
  ],
  "Women's Cut": [
    { name: "Scalp Massage", cost: 30 },
    { name: "Hydration/Repair", cost: 10 },
  ],
  "Kids Cut": [
    { name: "Detangling", cost: 15 },
    { name: "Braiding", cost: 20 },
  ],

  // Nails Add-Ons
  "Manicure": [
    { name: "French Tip", cost: 10 },
    { name: "Gel Polish Upgrade", cost: 15 },
    { name: "Cuticle Treatment", cost: 10 },
    { name: "Paraffin Wax", cost: 20 },
  ],
  "Pedicure": [
    { name: "French Tip", cost: 10 },
    { name: "Gel Polish Upgrade", cost: 15 },
    { name: "Callus Removal", cost: 15 },
    { name: "Paraffin Wax", cost: 20 },
  ],
  "Gel": [
    { name: "Nail Art (per nail)", cost: 5 },
    { name: "French Tip", cost: 10 },
  ],
  "Acrylic": [
    { name: "Nail Art (per nail)", cost: 5 },
    { name: "French Tip", cost: 10 },
    { name: "Length Upgrade", cost: 10 },
  ],
  "Nail Art": [], // Typically custom
  "Removal": [{ name: "Hydrating Oil", cost: 5 }],

  // Beauty & Brows Add-Ons
  "Brows": [
    { name: "Brow Tint", cost: 15 },
    { name: "Lash Tint", cost: 20 },
    { name: "Quick Facial", cost: 30 },
    { name: "Lip Wax", cost: 10 },
    { name: "Chin Wax", cost: 10 },
  ],
  "Lashes": [
    { name: "Lash Tint", cost: 20 },
    { name: "Brow Wax", cost: 20 },
  ],
  "Makeup": [
    { name: "False Lashes", cost: 15 },
    { name: "Airbrush Upgrade", cost: 30 },
  ],
  "Facial": [
    { name: "LED Light Therapy", cost: 30 },
    { name: "Extractions", cost: 20 },
    { name: "Eye Treatment", cost: 15 },
  ],
  "Waxing": [
    { name: "Soothing Gel", cost: 5 },
  ],
  "Threading": [
    { name: "Soothing Gel", cost: 5 },
  ],
  "Tinting": [
    { name: "Brow Wax", cost: 20 },
  ],
};

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
  const [endHour, setEndHour] = useState<string>("");
  const [endMinute, setEndMinute] = useState<string>("00");
  const [endPeriod, setEndPeriod] = useState<"AM" | "PM">("AM");
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
  const [startHour, setStartHour] = useState<string>("");
  const [startMinute, setStartMinute] = useState<string>("00");
  const [startPeriod, setStartPeriod] = useState<"AM" | "PM">("AM");

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
    setShowDatePicker(false);
    if (!showTimeSlotForm) {
      setShowTimeSlotForm(true);
    }
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      price: "",
      staffIds: [],
    });
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
    setEndHour("");
    setEndMinute("00");
    setEndPeriod("AM");
    setSelectedAddOns([]);
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
    return `${endHours}:${endMinutes}`;
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

    // Only set start time - end time must be explicitly selected
    setNewTimeSlot({
      ...newTimeSlot,
      startTime: startTime24,
    });

    // If end time is set, validate it
    if (newTimeSlot.endTime) {
      const start = new Date(`2000-01-01T${startTime24}`);
      const end = new Date(`2000-01-01T${newTimeSlot.endTime}`);
      if (end <= start) {
        setError("End time must be after start time.");
        return;
      }

      // Check for conflicts
      const selectedStaffIds = newTimeSlot.staffIds;
      if (selectedStaffIds.length === 0) {
        setError("Please assign staff to check for time conflicts.");
        return;
      }
      const hasConflict = checkTimeConflict(startTime24, newTimeSlot.endTime, selectedStaffIds);

      if (hasConflict) {
        setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
        return;
      }
    }

    setError("");
  };

  useEffect(() => {
    if (startHour && startMinute && startPeriod) {
      const startTime24 = convertTo24Hour(startHour, startMinute, startPeriod);

      // Only update start time - end time must be explicitly selected by user
      setNewTimeSlot(prev => ({
        ...prev,
        startTime: startTime24,
      }));

      // Clear any existing error when start time changes
      if (newTimeSlot.endTime) {
        // If end time is already set, validate it
        const start = new Date(`2000-01-01T${startTime24}`);
        const end = new Date(`2000-01-01T${newTimeSlot.endTime}`);
        if (end <= start) {
          setError("End time must be after start time.");
        } else {
          const selectedStaffIds = newTimeSlot.staffIds;
          if (selectedStaffIds.length === 0) {
            setError("Please assign staff to check for time conflicts.");
          } else {
            const hasConflict = checkTimeConflict(startTime24, newTimeSlot.endTime, selectedStaffIds);
            if (hasConflict) {
              setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
            } else {
              setError("");
            }
          }
        }
      } else {
        setError("");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour, startMinute, startPeriod]);

  // Update endTime when end time fields change
  useEffect(() => {
    if (endHour && endMinute && endPeriod) {
      const endTime24 = convertTo24Hour(endHour, endMinute, endPeriod);

      // Only validate if start time is set
      if (newTimeSlot.startTime) {
        // Validate end time is after start time
        const start = new Date(`2000-01-01T${newTimeSlot.startTime}`);
        const end = new Date(`2000-01-01T${endTime24}`);
        if (end <= start) {
          setError("End time must be after start time.");
          setNewTimeSlot(prev => ({ ...prev, endTime: "" }));
          return;
        }

        // Check for conflicts
        const selectedStaffIds = newTimeSlot.staffIds;
        if (selectedStaffIds.length === 0) {
          setError("Please assign staff to check for time conflicts.");
        } else {
          const hasConflict = checkTimeConflict(newTimeSlot.startTime, endTime24, selectedStaffIds);

          if (hasConflict) {
            setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
          } else {
            setError("");
          }
        }
      }

      setNewTimeSlot(prev => ({
        ...prev,
        endTime: endTime24,
      }));
    } else if (!endHour && newTimeSlot.endTime) {
      // Clear endTime if endHour is cleared
      setNewTimeSlot(prev => ({
        ...prev,
        endTime: "",
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endHour, endMinute, endPeriod, newTimeSlot.startTime]);

  useEffect(() => {
    if (newTimeSlot.startTime && newTimeSlot.endTime && selectedDate) {
      const selectedStaffIds = newTimeSlot.staffIds;
      if (selectedStaffIds.length === 0) {
        setError("Please assign staff to check for time conflicts.");
      } else {
        const hasConflict = checkTimeConflict(newTimeSlot.startTime, newTimeSlot.endTime, selectedStaffIds);

        if (hasConflict) {
          setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
        } else {
          setError("");
        }
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
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
    setEndHour("");
    setEndMinute("00");
    setEndPeriod("AM");
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

      // Ensure all data is serializable
      const requestBody = {
        category: data.category,
        subCategory: data.subCategory,
        serviceName: data.subCategory, // Use subCategory as serviceName
        description: data.description || "",
        address: data.address,
        businessId: foundBusinessId,

        addOns: selectedAddOns, // Include selected add-ons
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
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-[40rem]">
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
                  <div className="relative">
                    <select
                      {...register("category")}
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                    >
                      <option value="">Select Category</option>
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
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
                      className="w-full px-4 py-2.5 pr-10 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all appearance-none cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">{selectedCategory && SUB_CATEGORIES[selectedCategory] ? "Select Service Name" : "Select Category First"}</option>
                      {selectedCategory && SUB_CATEGORIES[selectedCategory] && SUB_CATEGORIES[selectedCategory].map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
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
                  className="w-full px-4 py-2.5 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all resize-none"
                  placeholder="Describe your service"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Dates and Time Slots Section */}
              <div className="space-y-4 pt-6 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-base font-bold text-[#3A3A3A]">
                    Dates & Time Slots <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
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
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-[#3A3A3A]">
                            Start Time <span className="text-red-500">*</span>
                          </label>
                          <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-200 md:hidden">
                            <TimePickerWheel
                              value={newTimeSlot.startTime || "09:00"}
                              onChange={(val) => {
                                const currentDuration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                                const durationToKeep = currentDuration > 0 ? currentDuration : 60;
                                const newEndTime = calculateEndTimeFromStart(val, durationToKeep);
                                setNewTimeSlot(prev => ({ ...prev, startTime: val, endTime: newEndTime }));
                              }}
                            />
                          </div>

                          {/* Desktop Time Picker */}
                          <div className="hidden md:flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
                              <div className="flex-1 relative">
                                <select
                                  value={startHour}
                                  onChange={(e) => {
                                    const newHour = e.target.value;
                                    setStartHour(newHour);
                                    if (newHour && startMinute) {
                                      const time = convertTo24Hour(newHour, startMinute, startPeriod);
                                      const currentDuration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                                      const durationToKeep = currentDuration > 0 ? currentDuration : 60;
                                      const newEndTime = calculateEndTimeFromStart(time, durationToKeep);

                                      setNewTimeSlot(prev => ({ ...prev, startTime: time, endTime: newEndTime }));

                                      // Update End Time Dropdowns
                                      if (newEndTime) {
                                        const [eh, em] = newEndTime.split(':').map(Number);
                                        setEndHour(String(eh % 12 || 12));
                                        setEndMinute(String(em).padStart(2, '0'));
                                        setEndPeriod(eh >= 12 ? 'PM' : 'AM');
                                      }
                                    } else {
                                      setNewTimeSlot(prev => ({ ...prev, startTime: "" }));
                                    }
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
                                    const newMinute = e.target.value;
                                    setStartMinute(newMinute);
                                    if (startHour && newMinute) {
                                      const time = convertTo24Hour(startHour, newMinute, startPeriod);
                                      const currentDuration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                                      const durationToKeep = currentDuration > 0 ? currentDuration : 60;
                                      const newEndTime = calculateEndTimeFromStart(time, durationToKeep);

                                      setNewTimeSlot(prev => ({ ...prev, startTime: time, endTime: newEndTime }));

                                      // Update End Time Dropdowns
                                      if (newEndTime) {
                                        const [eh, em] = newEndTime.split(':').map(Number);
                                        setEndHour(String(eh % 12 || 12));
                                        setEndMinute(String(em).padStart(2, '0'));
                                        setEndPeriod(eh >= 12 ? 'PM' : 'AM');
                                      }
                                    } else {
                                      setNewTimeSlot(prev => ({ ...prev, startTime: "" }));
                                    }
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
                                    const newPeriod = "AM";
                                    setStartPeriod(newPeriod);
                                    if (startHour && startMinute) {
                                      const time = convertTo24Hour(startHour, startMinute, newPeriod);
                                      const currentDuration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                                      const durationToKeep = currentDuration > 0 ? currentDuration : 60;
                                      const newEndTime = calculateEndTimeFromStart(time, durationToKeep);

                                      setNewTimeSlot(prev => ({ ...prev, startTime: time, endTime: newEndTime }));

                                      // Update End Time Dropdowns
                                      if (newEndTime) {
                                        const [eh, em] = newEndTime.split(':').map(Number);
                                        setEndHour(String(eh % 12 || 12));
                                        setEndMinute(String(em).padStart(2, '0'));
                                        setEndPeriod(eh >= 12 ? 'PM' : 'AM');
                                      }
                                    }
                                  }}
                                  disabled={!selectedDate || !startHour}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${startPeriod === "AM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPeriod = "PM";
                                    setStartPeriod(newPeriod);
                                    if (startHour && startMinute) {
                                      const time = convertTo24Hour(startHour, startMinute, newPeriod);
                                      const currentDuration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                                      const durationToKeep = currentDuration > 0 ? currentDuration : 60;
                                      const newEndTime = calculateEndTimeFromStart(time, durationToKeep);

                                      setNewTimeSlot(prev => ({ ...prev, startTime: time, endTime: newEndTime }));

                                      // Update End Time Dropdowns
                                      if (newEndTime) {
                                        const [eh, em] = newEndTime.split(':').map(Number);
                                        setEndHour(String(eh % 12 || 12));
                                        setEndMinute(String(em).padStart(2, '0'));
                                        setEndPeriod(eh >= 12 ? 'PM' : 'AM');
                                      }
                                    }
                                  }}
                                  disabled={!selectedDate || !startHour}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${startPeriod === "PM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  PM
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="block text-sm font-semibold text-[#3A3A3A]">
                            End Time <span className="text-red-500">*</span>
                          </label>
                          <div className="flex justify-center bg-gray-50 rounded-xl p-4 border border-gray-200 md:hidden">
                            <TimePickerWheel
                              value={newTimeSlot.endTime || calculateEndTimeFromStart(newTimeSlot.startTime || "09:00")}
                              onChange={(val) => {
                                setNewTimeSlot(prev => ({ ...prev, endTime: val }));
                              }}
                            />
                          </div>

                          {/* Desktop End Time Picker */}
                          <div className="hidden md:flex items-center gap-3">
                            <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-xl p-1 border border-gray-200">
                              <div className="flex-1 relative">
                                <select
                                  value={endHour}
                                  onChange={(e) => {
                                    const newHour = e.target.value;
                                    setEndHour(newHour);
                                    if (newHour && endMinute) {
                                      const time = convertTo24Hour(newHour, endMinute, endPeriod);
                                      setNewTimeSlot(prev => ({ ...prev, endTime: time }));
                                    } else {
                                      setNewTimeSlot(prev => ({ ...prev, endTime: "" }));
                                    }
                                  }}
                                  disabled={!selectedDate || !newTimeSlot.startTime}
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
                                  value={endMinute}
                                  onChange={(e) => {
                                    const newMinute = e.target.value;
                                    setEndMinute(newMinute);
                                    if (endHour && newMinute) {
                                      const time = convertTo24Hour(endHour, newMinute, endPeriod);
                                      setNewTimeSlot(prev => ({ ...prev, endTime: time }));
                                    } else {
                                      setNewTimeSlot(prev => ({ ...prev, endTime: "" }));
                                    }
                                  }}
                                  disabled={!selectedDate || !newTimeSlot.startTime || !endHour}
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
                                    const newPeriod = "AM";
                                    setEndPeriod(newPeriod);
                                    if (endHour && endMinute) {
                                      const time = convertTo24Hour(endHour, endMinute, newPeriod);
                                      setNewTimeSlot(prev => ({ ...prev, endTime: time }));
                                    }
                                  }}
                                  disabled={!selectedDate || !newTimeSlot.startTime || !endHour}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${endPeriod === "AM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  AM
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const newPeriod = "PM";
                                    setEndPeriod(newPeriod);
                                    if (endHour && endMinute) {
                                      const time = convertTo24Hour(endHour, endMinute, newPeriod);
                                      setNewTimeSlot(prev => ({ ...prev, endTime: time }));
                                    }
                                  }}
                                  disabled={!selectedDate || !newTimeSlot.startTime || !endHour}
                                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${endPeriod === "PM"
                                    ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm"
                                    : "text-gray-500 hover:text-[#3A3A3A] hover:bg-gray-50"
                                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                  PM
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Duration Display - Calculated */}
                          {/* Duration Display - Calculated */}
                          {newTimeSlot.startTime && newTimeSlot.endTime && (() => {
                            const duration = calculateDuration(newTimeSlot.startTime, newTimeSlot.endTime);
                            return (
                              <div className="flex items-center gap-2 text-sm justify-center mt-2">
                                <span className="text-gray-500">Duration:</span>
                                <span className="font-semibold text-[#3A3A3A] px-3 py-1.5 bg-[#EECFD1]/10 rounded-lg">
                                  {formatDuration(duration) || "0mins"}
                                </span>
                              </div>
                            );
                          })()}
                        </div>
                      </div>

                      {/* Add-Ons Selection */}
                      <div className="space-y-3 pt-4 border-t border-[#E5E5E5]">
                        <div className="flex items-center justify-between">
                          <label className="block text-sm font-semibold text-[#3A3A3A]">
                            Add-Ons for this Slot <span className="text-[#888888] text-xs font-normal">(Optional)</span>
                          </label>
                          <button
                            type="button"
                            onClick={() => setIsAddOnsDropdownOpen(!isAddOnsDropdownOpen)}
                            className="text-sm font-medium text-primary hover:text-primary/80"
                          >
                            {isAddOnsDropdownOpen ? "Close" : "+ Add Add-On"}
                          </button>
                        </div>

                        {isAddOnsDropdownOpen && (
                          <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-3">
                            <p className="text-sm text-gray-500 mb-3">Select available add-ons:</p>
                            <div className="flex flex-wrap gap-2">
                              {selectedSubCategory && SUB_CATEGORY_ADDONS[selectedSubCategory]?.map((addOn, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => handleToggleAddOn(addOn)}
                                  className={`px-3 py-1.5 rounded-full text-sm transition-colors border ${selectedAddOns.some(a => a.name === addOn.name)
                                    ? "bg-primary text-white border-primary"
                                    : "bg-white text-gray-700 border-gray-300 hover:border-primary"
                                    }`}
                                >
                                  {addOn.name} (+${addOn.cost})
                                </button>
                              ))}
                              {(!selectedSubCategory || !SUB_CATEGORY_ADDONS[selectedSubCategory]) && (
                                <p className="text-sm text-gray-400 italic">Select a sub-category to see add-ons</p>
                              )}
                            </div>
                          </div>
                        )}

                        {selectedAddOns.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {selectedAddOns.map((addOn, idx) => (
                              <div key={idx} className="bg-[#EECFD1]/20 border border-[#EECFD1] rounded-full px-3 py-1 flex items-center gap-2">
                                <span className="text-sm font-medium text-[#3A3A3A]">{addOn.name} (${addOn.cost})</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleAddOn(addOn)}
                                  className="text-[#3A3A3A]/60 hover:text-[#3A3A3A]"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Price Field for Time Slot */}
                      <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#3A3A3A]">
                          Price ($) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
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
                            disabled={!selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime}
                            className="w-full pl-8 pr-4 py-3 rounded-lg border border-[#E5E5E5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
                            placeholder="50.00"
                            required
                          />
                        </div>
                        <p className="text-xs text-[#888888]">
                          Price for this specific time slot
                        </p>
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
                                onChange={() => handleToggleStaff(member.id || member._id)}
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
                              const slotDuration = slot.duration || calculateDuration(slot.startTime, slot.endTime);

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-[#F5F5F5] rounded-lg border border-[#E5E5E5]"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#3A3A3A]">
                                      {formatTime12Hour(slot.startTime)} - {formatTime12Hour(slot.endTime)} • ${slot.price?.toFixed(2) || "0.00"} • {formatDuration(slotDuration)}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-[#888888]">
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

