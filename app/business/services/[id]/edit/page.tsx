"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceUpdateSchema, type ServiceUpdateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

const CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Skin & Facials",
  "Dog Grooming",
];

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
    cost: "",
    staffIds: [] as string[],
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ServiceUpdateInput>({
    resolver: zodResolver(serviceUpdateSchema),
  });

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
        setValue("subCategory", data.service.subCategory || "");
        setValue("serviceName", data.service.serviceName);
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

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/services/${serviceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
        cost: newTimeSlot.cost ? parseFloat(newTimeSlot.cost) : undefined,
        staffIds: newTimeSlot.staffIds,
        duration,
      };

      // Add slot to the selected date locally
      const updatedDates = {
        ...datesWithSlots,
        [selectedDate]: [...(datesWithSlots[selectedDate] || []), slot],
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
          cost: "",
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
    setNewTimeSlot({
      ...newTimeSlot,
      staffIds: newTimeSlot.staffIds.includes(staffId)
        ? newTimeSlot.staffIds.filter(id => id !== staffId)
        : [...newTimeSlot.staffIds, staffId],
    });
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
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8">
              Edit Service
            </h1>

            {error && (
              <Alert className="mb-6 bg-red-50 border-red-200">
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">{success}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Category *
                </label>
                <select
                  {...register("category")}
                  className="input-polished"
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

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Service Name *
                </label>
                <input
                  {...register("serviceName")}
                  type="text"
                  className="input-polished"
                  placeholder="e.g., Men's Haircut"
                />
                {errors.serviceName && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.serviceName.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                    Duration *
                  </label>
                  <input
                    {...register("duration")}
                    type="text"
                    className="input-polished"
                    placeholder="e.g., 30mins"
                  />
                  {errors.duration && (
                    <p className="text-red-500 text-sm mt-1.5">
                      {errors.duration.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                    Base Cost ($) *
                  </label>
                  <input
                    {...register("baseCost", { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    className="input-polished"
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
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Address *
                </label>
                <input
                  {...register("address")}
                  type="text"
                  className="input-polished"
                  placeholder="123 Main St, City"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Description
                </label>
                <textarea
                  {...register("description")}
                  rows={4}
                  className="input-polished resize-none"
                  placeholder="Describe your service..."
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Dates and Time Slots Management Section */}
              <div className="space-y-4 pt-6 border-t-2 border-primary/20">
                <div className="bg-primary/5 rounded-xl p-4 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <label className="block text-base font-bold text-[#3A3A3A] mb-1">
                        📅 Dates & Time Slots <span className="text-red-500">*</span>
                      </label>
                      <p className="text-sm text-gray-600">
                        Manage dates and time slots when customers can book this service. You can add multiple dates and multiple time slots per date.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => setShowDatePicker(true)}
                      variant="outline"
                      size="sm"
                      className="rounded-lg border-primary/30 hover:bg-primary/10"
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

                {/* Time Slot Form - Shows when a date is selected */}
                {showTimeSlotForm && selectedDate && (
                  <div className="bg-white rounded-xl p-6 space-y-5 border-2 border-primary/30 shadow-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-bold text-[#3A3A3A]">
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
                        className="text-gray-500 hover:text-[#3A3A3A]"
                      >
                        ✕
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#3A3A3A] flex items-center gap-1">
                          <span>🕐</span> Start Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={newTimeSlot.startTime}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, startTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#3A3A3A] flex items-center gap-1">
                          <span>🕐</span> End Time <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={newTimeSlot.endTime}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, endTime: e.target.value })}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-[#3A3A3A]">
                        Cost (Optional) - Leave empty to use base cost
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={newTimeSlot.cost}
                          onChange={(e) => setNewTimeSlot({ ...newTimeSlot, cost: e.target.value })}
                          placeholder="e.g., 60.00"
                          className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-300 bg-white text-[#3A3A3A] focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                        />
                      </div>
                    </div>

                    {staff.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-[#3A3A3A]">Assign Staff (Optional)</label>
                        <div className="border-2 border-gray-300 rounded-xl p-3 bg-white max-h-40 overflow-y-auto">
                          {staff.map((member) => (
                            <label key={member.id || member._id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                              <input
                                type="checkbox"
                                checked={newTimeSlot.staffIds.includes(member.id || member._id)}
                                onChange={() => handleToggleStaff(member.id || member._id)}
                                className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                              />
                              <span className="text-sm font-medium text-[#3A3A3A]">{member.name}</span>
                            </label>
                          ))}
                        </div>
                        {newTimeSlot.staffIds.length > 0 && (
                          <div className="mt-2 p-2 bg-primary/10 rounded-lg">
                            <p className="text-xs font-semibold text-primary mb-1">Staff Selected:</p>
                            <p className="text-sm text-[#3A3A3A]">
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
                        className="flex-1 btn-polished btn-polished-primary rounded-lg"
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
                        className="rounded-lg"
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
                        <div key={date} className="bg-white rounded-xl p-5 border-2 border-gray-200 shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">📅</span>
                              <div>
                                <h4 className="font-bold text-lg text-[#3A3A3A]">
                                  {new Date(date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric"
                                  })}
                                </h4>
                                <p className="text-xs text-gray-500">
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
                                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                  <div className="flex-1">
                                    <p className="text-sm font-semibold text-[#3A3A3A]">
                                      Time Slot: {slot.startTime} To {slot.endTime} {slot.duration}
                                    </p>
                                    <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
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
                                    onClick={() => handleDeleteTimeSlot(date, index)}
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
                  <div className="text-center py-10 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      No dates added yet
                    </p>
                    <p className="text-xs text-gray-500">
                      Click &quot;Add Date&quot; above to add dates and time slots for this service
                    </p>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-polished btn-polished-primary"
                >
                  {isLoading ? "Updating..." : "Update Service"}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-200 text-[#3A3A3A] hover:bg-gray-300 rounded-lg px-6 py-3 font-semibold transition-all duration-200 shadow-sm hover:shadow-md"
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

