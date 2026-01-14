"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffCreateSchema, staffUpdateSchema, type StaffUpdateInput } from "@/lib/validation";
import { z } from "zod";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

interface StaffFormProps {
    staffId?: string;
    onSuccess: () => void;
    onCancel: () => void;
}

// Schema for the form itself (UI validation)
// We'll combine create/update requirements mostly
const formSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    about: z.string().optional(),
    qualifications: z.string().optional(),
    photo: z.any().optional(), // File or string
});

type FormValues = z.infer<typeof formSchema>;

export function StaffForm({ staffId, onSuccess, onCancel }: StaffFormProps) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(!!staffId);
    const [error, setError] = useState<string>("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [fetchedData, setFetchedData] = useState<FormValues | undefined>(undefined);

    const {
        register,
        handleSubmit,
        formState: { errors },
        setValue,
        reset,
    } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        values: fetchedData, // Reactively update form when data is fetched
        defaultValues: {
            name: "",
            about: "",
            qualifications: "",
        }
    });

    // Load staff data if editing
    useEffect(() => {
        if (!staffId) {
            setFetchedData(undefined);
            reset({
                name: "",
                about: "",
                qualifications: "",
            });
            return;
        }

        const loadStaff = async () => {
            try {
                const response = await fetch(`/api/staff/${staffId}`, {
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include", // Use session cookies
                });

                if (response.ok) {
                    const responseData = await response.json();

                    // Handle both wrapped successResponse format { data: { staff: ... } } and direct format { staff: ... }
                    const staffData = responseData.data?.staff || responseData.staff;

                    if (staffData) {
                        setFetchedData({
                            name: staffData.name || "",
                            qualifications: staffData.qualifications || "",
                            about: staffData.about || staffData.bio || "",
                        });

                        if (staffData.photo) {
                            setImagePreview(staffData.photo);
                        }
                    }
                } else {
                    setError("Failed to load staff details");
                }
            } catch (err) {
                console.error("Error loading staff:", err);
                setError("Failed to load staff details");
            } finally {
                setIsLoadingData(false);
            }
        };

        loadStaff();
    }, [staffId, reset]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const convertImageToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    const getBusinessId = async (userId: string): Promise<string | null> => {
        try {
            const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
                headers: { "Content-Type": "application/json" },
                credentials: "include", // Use session cookies
            });
            if (!businessResponse.ok) return null;
            const businessData = await businessResponse.json();
            if (businessData.businesses?.length > 0) {
                return businessData.businesses[0].id || businessData.businesses[0]._id;
            }
            return null;
        } catch (e) {
            console.error("Error fetching business:", e);
            return null;
        }
    };

    const onSubmit = async (data: FormValues) => {
        setIsLoading(true);
        setError("");

        try {
            // Get user session to retrieve userId
            const sessionRes = await fetch('/api/auth/session');
            const sessionData = await sessionRes.json();
            if (!sessionData.success || !sessionData.data.user) {
                throw new Error("Please sign in");
            }
            const userId = sessionData.data.user.id || sessionData.data.user._id;

            // UPDATE EXISTING STAFF (PUT + JSON)
            if (staffId) {
                let photoUrl = imagePreview || "";

                // If new image selected, convert to base64 for PUT
                // NOTE: This relies on existing (legacy) backend behavior for PUT
                if (selectedImage) {
                    photoUrl = await convertImageToBase64(selectedImage);
                }

                const response = await fetch(`/api/staff/${staffId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include", // Use session cookies
                    body: JSON.stringify({
                        name: data.name,
                        about: data.about,
                        qualifications: data.qualifications,
                        photo: photoUrl || undefined,
                    }),
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Failed to update staff");

                toast({ title: "Success", description: "Staff member updated successfully" });
                onSuccess();
            }
            // CREATE NEW STAFF (POST + FormData)
            else {
                const businessId = await getBusinessId(userId);
                if (!businessId) throw new Error("Business not found. Please register first.");

                const formData = new FormData();
                formData.append("businessId", businessId);
                formData.append("name", data.name);
                if (data.qualifications) formData.append("qualifications", data.qualifications);
                if (data.about) formData.append("about", data.about);

                if (selectedImage) {
                    formData.append("photo", selectedImage);
                }

                const response = await fetch("/api/staff", {
                    method: "POST",
                    credentials: "include", // Use session cookies
                    body: formData,
                });

                const result = await response.json();
                if (!response.ok) throw new Error(result.error || "Failed to add staff");

                toast({ title: "Success", description: "Staff member added successfully" });
                onSuccess();
            }

        } catch (err: any) {
            console.error("Staff form error:", err);
            setError(err.message || "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoadingData) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-auto">
            {/* Header */}
            <h2 className="text-xl font-semibold text-[#3A3A3A] mb-6 text-center">
                {staffId ? "EDIT STAFF" : "ADD STAFF"}
            </h2>

            {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Image Upload */}
                <div className="flex justify-center pt-2">
                    <div className="relative group">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer overflow-hidden border-2 border-transparent hover:border-[#EECFD1] transition-all"
                        >
                            {imagePreview ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={imagePreview}
                                    alt="Staff preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-gray-400 text-xs text-center px-2">Click to upload</span>
                            )}
                        </div>
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full flex items-center justify-center cursor-pointer z-10 shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-white" strokeWidth={3} />
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                        />
                    </div>
                </div>

                {/* Name */}
                <div>
                    <input
                        {...register("name")}
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 text-[#3A3A3A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all text-center font-medium"
                        placeholder="Name"
                    />
                    {errors.name && (
                        <p className="text-red-500 text-xs mt-1.5 text-center">{errors.name.message}</p>
                    )}
                </div>

                {/* About/Qualifications */}
                <div>
                    <textarea
                        {...register("about")}
                        rows={4}
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 text-[#3A3A3A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all resize-none text-left leading-relaxed text-sm"
                        placeholder="About staff member..."
                    />
                </div>

                <div>
                    <input
                        {...register("qualifications")}
                        type="text"
                        className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 text-[#3A3A3A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all text-left text-sm"
                        placeholder="Qualifications (optional)"
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-3 rounded-xl bg-gray-100 text-[#3A3A3A] hover:bg-gray-200 font-semibold transition-colors disabled:opacity-50"
                        disabled={isLoading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 py-3 rounded-xl bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] font-semibold transition-colors disabled:opacity-50 flex justify-center items-center"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        ) : (
                            staffId ? "UPDATE" : "ADD"
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
