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

const CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Skin & Facials",
  "Dog Grooming",
];

export default function CreateServicePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
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
    cost: "",
    staffIds: [] as string[],
  });

  // Form schema without businessId (we add it dynamically)
  const formSchema = serviceCreateSchema.omit({ businessId: true });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<ServiceCreateInput, 'businessId'>>({
    resolver: zodResolver(formSchema),
    mode: "onChange", // Validate on change
  });

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
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      cost: "",
      staffIds: [],
    });
  };

  const handleAddTimeSlot = () => {
    if (!selectedDate || !newTimeSlot.startTime || !newTimeSlot.endTime) {
      setError("Please select a date and fill in start time and end time");
      return;
    }

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
      cost: newTimeSlot.cost ? parseFloat(newTimeSlot.cost) : undefined,
      staffIds: newTimeSlot.staffIds,
      duration,
    };

    // Add slot to the selected date
    setDatesWithSlots({
      ...datesWithSlots,
      [selectedDate]: [...(datesWithSlots[selectedDate] || []), slot],
    });

    // Reset form but keep date selected
    setNewTimeSlot({
      startTime: "",
      endTime: "",
      cost: "",
      staffIds: [],
    });
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
    console.log("=== SERVICE FORM SUBMITTED ===");
    console.log("Form data:", data);
    
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

      console.log("User ID:", userId);

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

      console.log("Business ID found:", foundBusinessId);
      console.log("Submitting service data:", { ...data, businessId: foundBusinessId });

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
      
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      console.log("Making POST request to /api/services...");

      const response = await fetch("/api/services", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Service API response status:", response.status);
      const result = await response.json();
      console.log("Service API response:", result);

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

      console.log("Service created successfully:", result);
      
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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-8 duration-500">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Create Service
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Add a new service to your business. Fill in the details below to get started.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">

              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50/50 backdrop-blur-sm">
                  <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
                </Alert>
              )}

              <form 
              onSubmit={handleSubmit(
                (data) => {
                  console.log("Form validation passed, calling onSubmit");
                  onSubmit(data);
                },
                (errors) => {
                  console.log("Form validation failed:", errors);
                  console.log("All validation errors:", JSON.stringify(errors, null, 2));
                  
                  // Get the first error with field name
                  const errorEntries = Object.entries(errors);
                  if (errorEntries.length > 0) {
                    const [fieldName, error] = errorEntries[0];
                    
                    // Map field names to user-friendly labels
                    const fieldLabels: Record<string, string> = {
                      category: "Category",
                      serviceName: "Service Name",
                      duration: "Duration",
                      baseCost: "Base Cost",
                      address: "Address",
                      description: "Description",
                    };
                    
                    const fieldLabel = fieldLabels[fieldName] || fieldName
                      .replace(/([A-Z])/g, ' $1')
                      .replace(/^./, str => str.toUpperCase())
                      .trim();
                    
                    const errorMsg = error?.message || `${fieldLabel} is required`;
                    
                    console.log(`Validation error on field "${fieldName}":`, errorMsg);
                    setError(`${fieldLabel}: ${errorMsg}`);
                    toast({
                      variant: "destructive",
                      title: "Validation Error",
                      description: `${fieldLabel}: ${errorMsg}`,
                    });
                  } else {
                    setError("Please fix the form errors");
                    toast({
                      variant: "destructive",
                      title: "Validation Error",
                      description: "Please fix the form errors",
                    });
                  }
                }
              )} 
              className="space-y-6 md:space-y-8"
            >
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Category <span className="text-destructive">*</span>
                </label>
                <select
                  {...register("category")}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.category.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Service Name <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("serviceName")}
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="e.g., Men's Haircut, Full Body Massage"
                />
                {errors.serviceName && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.serviceName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Duration <span className="text-destructive">*</span>
                  </label>
                  <input
                    {...register("duration")}
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    placeholder="e.g., 30mins, 1 hour"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1.5">
                      {errors.duration.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">
                    Base Cost ($) <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <input
                      {...register("baseCost", { 
                        valueAsNumber: true,
                        required: "Base cost is required",
                        min: {
                          value: 0,
                          message: "Base cost must be 0 or greater"
                        },
                        validate: (value) => {
                          if (value === null || value === undefined || isNaN(value)) {
                            return "Base cost must be a valid number";
                          }
                          return true;
                        }
                      })}
                      type="number"
                      step="0.01"
                      min="0"
                      className="w-full pl-8 pr-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      placeholder="50.00"
                    />
                  </div>
                  {errors.baseCost && (
                    <p className="text-red-500 text-sm mt-1.5">
                      {errors.baseCost.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Address <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("address")}
                  type="text"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  placeholder="123 Main St, City, State ZIP"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Description <span className="text-muted-foreground text-xs">(Optional)</span>
                </label>
                <textarea
                  {...register("description")}
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                  placeholder="Describe your service in detail. What makes it special? What should customers expect?"
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.description.message}
                  </p>
                )}
              </div>

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
      </div>
    </PageLayout>
  );
}

