"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceCreateSchema, type ServiceCreateInput } from "@/lib/validation";
import { z } from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
  const [serviceDuration, setServiceDuration] = useState<string>(""); // Auto-calculated from first time slot
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
    cost: "",
    staffIds: [] as string[],
  });

  // Form schema without businessId (we add it dynamically)
  const formSchema = serviceCreateSchema.omit({ businessId: true });

  const {
    register,
    handleSubmit,
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

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
    setShowDatePicker(false);
    setShowTimeSlotForm(true);
    // Keep the default staff selection, only reset time and cost
    setNewTimeSlot(prev => ({
      ...prev,
      startTime: "",
      endTime: "",
      cost: "",
    }));
  };

  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime) {
      setError("Please select a date and fill in start time and end time");
      return;
    }

    // Calculate duration from start and end time
    const start = new Date(`2000-01-01T${newTimeSlot.startTime}`);
    const end = new Date(`2000-01-01T${newTimeSlot.endTime}`);
    const durationMs = end.getTime() - start.getTime();

    if (durationMs <= 0) {
      setError("End time must be after start time");
      return;
    }

    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    const duration = hours > 0 ? `${hours}Hr${minutes > 0 ? ` ${minutes}mins` : ''}` : `${minutes}mins`;

    // If this is the first time slot, set the service duration
    if (!serviceDuration && Object.keys(datesWithSlots).length === 0) {
      setServiceDuration(duration);
      setValue("duration", duration); // Set the hidden duration field
    } else if (serviceDuration && duration !== serviceDuration) {
      // Enforce same duration for all time slots
      setError(`All time slots must have the same duration (${serviceDuration}). This slot is ${duration}.`);
      return;
    }

    const slot = {
      startTime: newTimeSlot.startTime,
      endTime: newTimeSlot.endTime,
      cost: newTimeSlot.cost ? parseFloat(newTimeSlot.cost) : undefined,
      staffIds: newTimeSlot.staffIds,
      duration,
    };

    // Add slot to the selected date
    setDatesWithSlots({
      ...datesWithSlots,
      [selectedDate]: [...(datesWithSlots[selectedDate] || []), slot],
    });

    // Reset form but keep date selected AND default staff
    setNewTimeSlot(prev => ({
      ...prev,
      startTime: "",
      endTime: "",
      cost: "",
      // staffIds are kept from previous state (default selection)
    }));
    setError("");
    toast({
      variant: "success",
      title: "Time slot added!",
      description: `Added time slot for ${new Date(selectedDate).toLocaleDateString()} (Duration: ${duration})`,
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



      const timeSlotsForSubmission = getTimeSlotsForSubmission();
      const requestBody = {
        ...data,
        businessId: foundBusinessId,
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
      router.push("/business/services");
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
          <div className="bg-white rounded-2xl border border-[#F5F5F5] p-6 md:p-8 shadow-sm">

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
                      serviceName: "Service Name",
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
              {/* Hidden duration field - auto-calculated */}
              <input type="hidden" {...register("duration")} />

              {/* 2-column grid for desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register("category")}
                    className="w-full px-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                  >
                    <option value="">Select category</option>
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

                {selectedCategory && SUB_CATEGORIES[selectedCategory] && (
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                      Sub-Category <span className="text-[#888888] text-xs">(Optional)</span>
                    </label>
                    <select
                      {...register("subCategory")}
                      className="w-full px-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                    >
                      <option value="">Select sub-category</option>
                      {SUB_CATEGORIES[selectedCategory].map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {subCat}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                    Service Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("serviceName")}
                    type="text"
                    className="w-full px-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                    placeholder="e.g., Men's Haircut"
                  />
                  {errors.serviceName && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.serviceName.message}
                    </p>
                  )}
                </div>

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
                      className="w-full pl-8 pr-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
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

              {serviceDuration && (
                <div className="bg-[#EECFD1]/10 border border-[#EECFD1]/30 rounded-lg p-4">
                  <p className="text-sm text-[#3A3A3A] font-medium">
                    ⏱️ Service Duration: <span className="text-[#EECFD1] font-bold">{serviceDuration}</span>
                  </p>
                  <p className="text-xs text-[#888888] mt-1">
                    All time slots will have this duration based on your first time slot.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  {...register("address")}
                  type="text"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all"
                  placeholder="123 Main St, City, State ZIP"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2">
                  Description <span className="text-[#888888] text-xs">(Optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg border border-[#F5F5F5] bg-white text-[#3A3A3A] placeholder:text-[#888888] focus:outline-none focus:ring-2 focus:ring-[#EECFD1]/20 focus:border-[#EECFD1] transition-all resize-none"
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
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Default Staff for this Service <span className="text-muted-foreground text-xs">(Optional)</span>
                  </label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Select staff members who usually perform this service. They will be automatically assigned to new time slots (you can change this per slot).
                  </p>
                  <div className="border border-border rounded-xl p-4 bg-background max-h-48 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {staff.map((member) => (
                      <label key={member.id || member._id} className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer transition-colors">
                        <input
                          type="checkbox"
                          checked={newTimeSlot.staffIds.includes(member.id || member._id)}
                          onChange={() => handleToggleStaff(member.id || member._id)}
                          className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                        />
                        <div className="flex items-center gap-2">
                          {member.photo ? (
                            <Image src={member.photo} alt={member.name} width={24} height={24} className="rounded-full object-cover" />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                              {member.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-sm font-medium">{member.name}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Dates and Time Slots Section */}
              <div className="space-y-4 pt-6 border-t-2 border-primary/20">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-base font-bold text-foreground mb-1">
                        📅 Dates & Time Slots <span className="text-destructive">*</span>
                      </label>
                      <p className="text-sm text-muted-foreground">
                        Add dates and time slots when customers can book this service. You can add multiple dates and multiple time slots per date.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-xl border-primary/30 hover:bg-primary/10"
                    >
                      + Add Date
                    </Button>
                  </div>
                </div>

                {/* Date Picker Modal */}
                {showDatePicker && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-foreground">Select Date</h3>
                        <button
                          onClick={() => setShowDatePicker(false)}
                          className="text-muted-foreground hover:text-foreground"
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
                        className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        autoFocus
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Select a date to add time slots
                      </p>
                    </div>
                  </div>
                )}

                {/* Time Slot Form - Shows when a date is selected */}
                {showTimeSlotForm && selectedDate && (
                  <div className="bg-card rounded-xl p-6 space-y-5 border-2 border-primary/30 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-foreground">
                        Add Time Slot for {new Date(selectedDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric"
                        })}
                      </h3>
                      <button
                        onClick={() => {
                          setShowTimeSlotForm(false);
                          setSelectedDate("");
                        }}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <span>🕐</span> Start Time <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="time"
                          value={newTimeSlot.startTime}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground flex items-center gap-1">
                          <span>🕐</span> End Time <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="time"
                          value={newTimeSlot.endTime}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground">
                        Cost (Optional) - Leave empty to use base cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={newTimeSlot.cost}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, cost: e.target.value })}
                          placeholder="e.g., 60.00"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                        />
                      </div>
                    </div>

                    {staff.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground">Assign Staff (Optional)</label>
                        <div className="border-2 border-border rounded-xl p-3 bg-background max-h-40 overflow-y-auto">
                          {staff.map((member) => (
                            <label key={member.id || member._id} className="flex items-center gap-2 p-2 hover:bg-muted/50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newTimeSlot.staffIds.includes(member.id || member._id)}
                                onChange={() => handleToggleStaff(member.id || member._id)}
                                className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                              />
                              <span className="text-sm font-medium">{member.name}</span>
                            </label>
                          ))}
                        </div>
                        {newTimeSlot.staffIds.length > 0 && (
                          <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                            <p className="text-xs font-semibold text-primary mb-1">Staff Selected:</p>
                            <p className="text-sm text-foreground">
                              {newTimeSlot.staffIds.map(id => {
                                const member = staff.find(s => (s.id || s._id) === id);
                                return member?.name;
                              }).filter(Boolean).join(", ")}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        onClick={handleAddTimeSlot}
                        className="flex-1 btn-polished-primary rounded-xl"
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
                        className="rounded-xl"
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
                        <div key={date} className="bg-card rounded-xl p-5 border-2 border-border/50 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📅</span>
                              <div>
                                <h4 className="font-bold text-lg text-foreground">
                                  {new Date(date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })}
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(date).toLocaleDateString("en-US", { weekday: "long" })}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                onClick={() => handleSelectDate(date)}
                                variant="outline"
                                size="sm"
                                className="text-xs"
                              >
                                + Add Slot
                              </Button>
                              <Button
                                type="button"
                                onClick={() => handleRemoveDate(date)}
                                variant="outline"
                                size="sm"
                                className="text-xs text-red-500 border-red-200 hover:bg-red-50"
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
                              const slotCost = slot.cost || "Base Cost";

                              return (
                                <div
                                  key={index}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-border/30"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-foreground">
                                      Time Slot: {slot.startTime} To {slot.endTime} {slot.duration}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                      <span>
                                        Cost: {typeof slotCost === 'number' ? `$${slotCost.toFixed(2)}` : String(slotCost)}
                                      </span>
                                      {assignedStaff.length > 0 && (
                                        <span className="text-primary font-medium">
                                          Staff: {assignedStaff.map((s: any) => s.name).join(", ")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    onClick={() => handleRemoveTimeSlot(date, index)}
                                    variant="outline"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 border-red-200 text-xs"
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
                  <div className="text-center py-10 bg-muted/20 rounded-xl border-2 border-dashed border-border/50">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">
                      No dates added yet
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Click &quot;Add Date&quot; above to add dates and time slots for this service
                    </p>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading || Object.keys(datesWithSlots).length === 0}
                  size="lg"
                  className="flex-1 h-12 rounded-xl btn-polished-primary shadow-lg hover:shadow-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Creating...
                    </>
                  ) : Object.keys(datesWithSlots).length === 0 ? (
                    "Add Dates & Time Slots First"
                  ) : (
                    "Create Service"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 rounded-xl border-2 font-semibold"
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

