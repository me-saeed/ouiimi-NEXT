"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceUpdateSchema, type ServiceUpdateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";

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

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingService, setIsLoadingService] = useState(true);
  const [service, setService] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  // Group time slots by date: { "2025-10-30": [{ startTime, endTime, cost, staffIds, duration }] }
  const [datesWithSlots, setDatesWithSlots] = useState<Record<string, Array<{
    startTime: string;
    endTime: string;
    cost?: number;
    staffIds: string[];
    duration?: string;
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
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, serviceId]);

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
        setValue("duration", data.service.duration);
        setValue("baseCost", data.service.baseCost);
        setValue("description", data.service.description || "");
        setValue("address", data.service.address);
        
        // Group time slots by date
        const grouped: Record<string, Array<{
          startTime: string;
          endTime: string;
          cost?: number;
          staffIds: string[];
          duration?: string;
        }>> = {};
        
        if (data.service.timeSlots && Array.isArray(data.service.timeSlots)) {
          data.service.timeSlots.forEach((slot: any) => {
            const date = new Date(slot.date).toISOString().split('T')[0];
            if (!grouped[date]) {
              grouped[date] = [];
            }
            
            // Calculate duration
            const start = new Date(`2000-01-01T${slot.startTime}`);
            const end = new Date(`2000-01-01T${slot.endTime}`);
            const durationMs = end.getTime() - start.getTime();
            const hours = Math.floor(durationMs / (1000 * 60 * 60));
            const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
            const duration = hours > 0 ? `${hours}Hr${minutes > 0 ? ` ${minutes}mins` : ''}` : `${minutes}mins`;
            
            grouped[date].push({
              startTime: slot.startTime,
              endTime: slot.endTime,
              cost: slot.cost,
              staffIds: (slot.staffIds || []).map((id: any) => String(id)),
              duration,
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
      const requestData = {
        ...data,
        serviceName: data.subCategory, // Use subCategory as serviceName
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

      setSuccess("Service updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/business/services");
      }, 1000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
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
    
    // Calculate end time based on duration from service
    const serviceDuration = service?.duration || "30mins";
    const durationMatch = serviceDuration.match(/(\d+)\s*[Hh][Rr]/);
    const minutesMatch = serviceDuration.match(/(\d+)\s*[Mm][Ii][Nn][Ss]/);
    let totalMinutes = 30; // default
    if (durationMatch) {
      totalMinutes = parseInt(durationMatch[1]) * 60;
    }
    if (minutesMatch) {
      totalMinutes += parseInt(minutesMatch[1]);
    }

    const [hours, minutes] = startTime24.split(":").map(Number);
    const startDate = new Date(`2000-01-01T${hours}:${minutes}:00`);
    const endDate = new Date(startDate.getTime() + totalMinutes * 60000);
    const endHours = String(endDate.getHours()).padStart(2, "0");
    const endMins = String(endDate.getMinutes()).padStart(2, "0");
    const endTime24 = `${endHours}:${endMins}`;

    // Check for conflicts with existing slots
    const selectedStaffIds = newTimeSlot.staffIds.length > 0 ? newTimeSlot.staffIds : [];
    const hasConflict = checkTimeConflict(startTime24, endTime24, selectedStaffIds);

    if (hasConflict) {
      setError(`This time slot conflicts with an existing booking for the selected staff on this date.`);
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
      handleTimeChange();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startHour, startMinute, startPeriod]);

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
  }, [newTimeSlot.staffIds, selectedDate]);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    if (!showTimeSlotForm) {
    setShowTimeSlotForm(true);
    }
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      staffIds: [],
    });
    setStartHour("");
    setStartMinute("00");
    setStartPeriod("AM");
  };

  const handleAddTimeSlot = async () => {
    if (!selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime) {
      setError("Please select a date and fill in start time and end time");
      return;
    }

    try {
      // Calculate duration
      const start = new Date(`2000-01-01T${newTimeSlot.startTime}`);
      const end = new Date(`2000-01-01T${newTimeSlot.endTime}`);
      const durationMs = end.getTime() - start.getTime();
      const hours = Math.floor(durationMs / (1000 * 60 * 60));
      const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
      const duration = hours > 0 ? `${hours}Hr${minutes > 0 ? ` ${minutes}mins` : ''}` : `${minutes}mins`;

      const slot = {
        startTime: newTimeSlot.startTime,
        endTime: newTimeSlot.endTime,
        staffIds: newTimeSlot.staffIds,
        duration,
      };

      // Check for duplicate time slots (same start time, end time, and staff for the same date)
      const existingSlots = datesWithSlots[selectedDate] || [];
      const isDuplicate = existingSlots.some((existingSlot: any) => {
        const sameTime = existingSlot.startTime === slot.startTime && existingSlot.endTime === slot.endTime;
        const sameStaff = JSON.stringify((existingSlot.staffIds || []).sort()) === JSON.stringify((slot.staffIds || []).sort());
        return sameTime && sameStaff;
      });

      if (isDuplicate) {
        setError(`This time slot (${formatTime12Hour(slot.startTime)} - ${formatTime12Hour(slot.endTime)}) with the same staff already exists for this date.`);
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
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          timeSlots: timeSlotsForSubmission,
        }),
      });

      if (response.ok) {
        setNewTimeSlot({
          startTime: "",
          endTime: "",
          staffIds: [],
        });
        setError("");
        setSuccess("Time slot added successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        // Revert on error
        setDatesWithSlots(datesWithSlots);
        const result = await response.json();
        setError(result.error || "Failed to add time slot");
      }
    } catch (err: any) {
      console.error("Error adding time slot:", err);
      setError("Failed to add time slot");
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
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
        setError(`This time slot (${formatTime12Hour(newTimeSlot.startTime)} - ${formatTime12Hour(newTimeSlot.endTime)}) with the selected staff is already booked for this date.`);
      } else {
        setError("");
      }
    }
  };


  // Convert datesWithSlots back to flat array for submission
  const getTimeSlotsForSubmission = (dates: Record<string, Array<{
    startTime: string;
    endTime: string;
    cost?: number;
    staffIds: string[];
  }>>) => {
    const slots: Array<{
      date: string;
      startTime: string;
      endTime: string;
      cost?: number;
      staffIds: string[];
      isBooked?: boolean;
      bookingId?: any;
    }> = [];
    Object.entries(dates).forEach(([date, timeSlots]) => {
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

  if (!user || isLoadingService) {
    return (
      <PageLayout user={user}>
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
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-bold text-[#3A3A3A] mb-6">
              Edit Service
            </h1>

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

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-lg border-0 overflow-hidden">
              <div className="p-8 space-y-6">
              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                </label>
                  <div className="relative">
                <select
                  {...register("category")}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 cursor-pointer"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Service Name <span className="text-red-500">*</span>
                </label>
                  <div className="relative">
                    <select
                      {...register("subCategory", { required: "Service name is required" })}
                      disabled={!selectedCategory || !SUB_CATEGORIES[selectedCategory]}
                      className="w-full px-4 py-3 pr-10 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all appearance-none hover:border-gray-300 cursor-pointer disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:opacity-60"
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
                  <p className="text-red-500 text-sm mt-1.5">
                      {errors.subCategory.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Duration <span className="text-red-500">*</span>
                  </label>
                  <input
                      {...register("duration", { 
                        required: "Duration is required",
                        validate: (value) => {
                          if (!value || value.trim() === "") {
                            return "Duration cannot be empty";
                          }
                          // Parse duration string to minutes
                          const parseDurationToMinutes = (durationStr: string): number => {
                            let totalMinutes = 0;
                            const hourMatch = durationStr.match(/(\d+)\s*[Hh][Rr]/);
                            const minuteMatch = durationStr.match(/(\d+)\s*[Mm][Ii][Nn][Ss]/);
                            
                            if (hourMatch) {
                              totalMinutes += parseInt(hourMatch[1], 10) * 60;
                            }
                            if (minuteMatch) {
                              totalMinutes += parseInt(minuteMatch[1], 10);
                            }
                            
                            // If no matches found, try to parse as just a number (assume minutes)
                            if (!hourMatch && !minuteMatch) {
                              const numMatch = durationStr.match(/(\d+)/);
                              if (numMatch) {
                                totalMinutes = parseInt(numMatch[1], 10);
                              }
                            }
                            
                            return totalMinutes;
                          };
                          
                          const minutes = parseDurationToMinutes(value);
                          if (minutes === 0) {
                            return "Please enter a valid duration format";
                          }
                          if (minutes < 15) {
                            return "Duration must be at least 15 minutes";
                          }
                          if (minutes > 180) {
                            return "Duration cannot exceed 3 hours (180 minutes)";
                          }
                          return true;
                        }
                      })}
                    type="text"
                      className={`w-full px-4 py-3 rounded-xl border ${
                        errors.duration ? "border-red-500" : "border-gray-200"
                      } bg-white text-gray-900 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all hover:border-gray-300`}
                      placeholder="e.g., 30mins or 1Hr 30mins"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1.5">
                      {errors.duration.message}
                    </p>
                  )}
                    <p className="text-xs text-gray-500 mt-1">
                      Format: e.g., &quot;30mins&quot; or &quot;1Hr 30mins&quot;. Minimum 15 minutes, maximum 3 hours (180 minutes).
                    </p>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Base Cost ($) <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("baseCost", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all hover:border-gray-300"
                    placeholder="50.00"
                  />
                  {errors.baseCost && (
                    <p className="text-red-500 text-sm mt-1.5">
                      {errors.baseCost.message}
                    </p>
                  )}
                </div>
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
                />
              </div>

              <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-[#EECFD1] transition-all resize-none hover:border-gray-300"
                  placeholder="Describe your service..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Dates and Time Slots Management Section */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <label className="block text-base font-bold text-[#3A3A3A] mb-2">
                          Dates & Time Slots <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-600">
                        Manage dates and time slots when customers can book this service. You can add multiple dates and multiple time slots per date.
                      </p>
                    </div>
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
                          size="sm"
                          className="rounded-xl border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium whitespace-nowrap"
                        >
                          + Add Time Slot
                        </Button>
                    <Button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      variant="outline"
                      size="sm"
                          className="rounded-xl border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium whitespace-nowrap"
                    >
                      + Add Date
                    </Button>
                      </div>
                  </div>
                </div>

                {/* Date Picker Modal */}
                {showDatePicker && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-[#3A3A3A]">Select Date</h3>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-gray-500 hover:text-[#3A3A3A]"
                        >
                          ✕
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        autoFocus
                      />
                      <p className="text-xs text-gray-500 mt-2">
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
                            Add Time Slot
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
                    
                      {/* Time Selection - Clean and Professional */}
                      <div className="space-y-3">
                        <label className="block text-sm font-semibold text-gray-700">
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
                                className="w-full px-4 py-3 pr-8 bg-transparent border-0 text-gray-900 font-medium text-base focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
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
                            <span className="text-gray-900 font-semibold text-lg">:</span>
                            <div className="flex-1 relative">
                              <select
                                value={startMinute}
                                onChange={(e) => {
                                  setStartMinute(e.target.value);
                                  setNewTimeSlot({ ...newTimeSlot, startTime: "", endTime: "" });
                                }}
                                disabled={!selectedDate || !startHour}
                                className="w-full px-4 py-3 pr-8 bg-transparent border-0 text-gray-900 font-medium text-base focus:outline-none focus:ring-0 disabled:opacity-50 disabled:cursor-not-allowed appearance-none cursor-pointer"
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

                    {staff.length > 0 && (
                      <div className="space-y-2">
                          <label className="text-sm font-semibold text-gray-700">Assign Staff (Optional)</label>
                          <div className="border border-gray-200 rounded-xl p-3 bg-gray-50 max-h-40 overflow-y-auto">
                          {staff.map((member) => (
                              <label key={member.id || member._id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors">
                              <input
                                type="checkbox"
                                  checked={newTimeSlot.staffIds.includes(String(member.id || member._id))}
                                  onChange={() => handleToggleStaff(String(member.id || member._id))}
                                  className="w-4 h-4 text-[#EECFD1] border-gray-300 rounded focus:ring-[#EECFD1]"
                              />
                                <span className="text-sm font-medium text-gray-700">{member.name}</span>
                            </label>
                          ))}
                        </div>
                        {newTimeSlot.staffIds.length > 0 && (
                            <div className="mt-2 p-3 bg-[#EECFD1]/10 rounded-lg border border-[#EECFD1]/20">
                              <p className="text-xs font-semibold text-[#EECFD1] mb-1">Staff Selected:</p>
                              <p className="text-sm text-gray-700">
                              {newTimeSlot.staffIds.map(id => {
                                  const member = staff.find(s => String(s.id || s._id) === id);
                                return member?.name;
                              }).filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                      <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        onClick={handleAddTimeSlot}
                          className="flex-1 h-11 rounded-xl bg-[#EECFD1] hover:bg-[#EECFD1]/90 text-[#3A3A3A] font-semibold"
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
                          className="flex-1 h-11 rounded-xl border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold"
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
                          <div key={date} className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                          <div className="flex items-center justify-between mb-4">
                              <div>
                                <h4 className="font-bold text-base text-[#3A3A3A]">
                                  {new Date(date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })}
                                </h4>
                                <p className="text-xs text-gray-500">
                                  {new Date(date).toLocaleDateString("en-US", { weekday: "long" })} • {new Date(date).toLocaleDateString("en-GB", {
                                    day: "numeric",
                                    month: "long",
                                    year: "numeric"
                                  })}
                                </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => handleSelectDate(date)}
                                variant="outline"
                                size="sm"
                                  className="rounded-lg border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-medium"
                              >
                                + Add Slot
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleRemoveDate(date)}
                                variant="outline"
                                size="sm"
                                  className="rounded-lg text-red-500 border-red-200 hover:bg-red-50 text-xs font-medium"
                              >
                                Remove Date
                              </Button>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            {slots.map((slot, index) => {
                              const assignedStaff = staff.filter((s: any) => 
                                slot.staffIds.includes(s.id || s._id)
                              );
                              
                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#3A3A3A]">
                                      Time Slot: {formatTime12Hour(slot.startTime)} To {formatTime12Hour(slot.endTime)} {slot.duration}
                                    </p>
                                      {assignedStaff.length > 0 && (
                                      <div className="mt-1 text-xs text-gray-600">
                                        <span className="text-[#EECFD1] font-medium">
                                          Staff: {assignedStaff.map((s: any) => s.name).join(", ")}
                                        </span>
                                      </div>
                                      )}
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => handleDeleteTimeSlot(date, index)}
                                    variant="outline"
                                    size="sm"
                                      className="rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs font-medium"
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
                ) : (
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      No dates added yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Click &quot;Add Date&quot; above to add dates and time slots for this service
                    </p>
                  </div>
                )}
              </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={isLoading}
                    className="flex-1 h-12 rounded-xl bg-[#EECFD1] hover:bg-[#EECFD1]/90 text-[#3A3A3A] font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                >
                  {isLoading ? "Updating..." : "Update Service"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                    className="flex-1 h-12 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 font-semibold transition-all"
                >
                  Cancel
                </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

