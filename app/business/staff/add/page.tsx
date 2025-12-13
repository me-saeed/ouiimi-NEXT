"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffCreateSchema, type StaffCreateInput } from "@/lib/validation";
import { z } from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Plus } from "lucide-react";

export default function AddStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Form schema without businessId and photo (we handle photo separately)
  const formSchema = staffCreateSchema.omit({ businessId: true, photo: true });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    console.log("=== FORM SUBMITTED ===");
    console.log("Form data:", data);
    console.log("Form errors:", errors);

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Please sign in to add staff");
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

      const formData = new FormData();
      formData.append("businessId", foundBusinessId);
      formData.append("name", data.name);
      if (data.qualifications) formData.append("qualifications", data.qualifications);
      if (data.about) formData.append("about", data.about);

      if (selectedImage) {
        formData.append("photo", selectedImage);
      }

      console.log("Making POST request to /api/staff with FormData...");

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          // Content-Type is set automatically for FormData
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      console.log("Staff API response status:", response.status);

      const result = await response.json();
      console.log("Staff API response body:", result);

      if (!response.ok) {
        const errorMsg = result.error || result.details || "Failed to add staff member";
        console.error("Staff creation failed:", errorMsg, result);

        // Show detailed error message
        let displayError = typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg);
        if (result.details && Array.isArray(result.details)) {
          displayError += ": " + result.details.map((d: any) => d.message || d).join(", ");
        }

        setError(displayError);

        // Show error toast
        toast({
          variant: "destructive",
          title: "Error",
          description: displayError,
        });

        setIsLoading(false);
        return;
      }

      console.log("Staff created successfully:", result);

      // Show toast notification
      toast({
        variant: "success",
        title: "Success!",
        description: "Staff member added successfully!",
      });

      setSuccess("Staff member added successfully! Redirecting...");

      // Show success message briefly
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force redirect to staff tab
      console.log("Redirecting to /business/dashboard?tab=staff");
      router.push("/business/dashboard?tab=staff");
    } catch (err: any) {
      console.error("Staff creation error:", err);
      const errorMsg = err.message || "Something went wrong. Please try again.";
      setError(errorMsg);

      // Show error toast
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
      <div className="bg-white min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {/* Title - Above the card */}
            <h1 className="text-xl font-semibold text-[#3A3A3A] mb-4">ADD</h1>

            {/* Form Card - No border, smooth white background */}
            <div className="bg-white rounded-2xl shadow-sm p-8">
              {error && (
                <Alert className="mb-4 border-red-200 bg-red-50">
                  <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-4 border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800 text-sm">{success}</AlertDescription>
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
                    const firstError = Object.values(errors)[0];
                    if (firstError) {
                      const errorMsg = firstError.message || "Please fix the form errors";
                      setError(errorMsg);
                      toast({
                        variant: "destructive",
                        title: "Validation Error",
                        description: errorMsg,
                      });
                    }
                  }
                )}
                className="space-y-6"
              >
                {/* Image Upload - Centered */}
                <div className="flex justify-center pt-2">
                  <div className="relative">
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors overflow-hidden"
                    >
                      {imagePreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={imagePreview}
                          alt="Staff preview"
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : null}
                    </div>
                    {/* Plus icon positioned below and to the right */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center cursor-pointer z-10 shadow-sm"
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

                {/* Name Input - Light grey background, centered text */}
                <div>
                  <input
                    {...register("name")}
                    type="text"
                    className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 text-[#3A3A3A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all text-center"
                    placeholder="Name"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1.5 text-center">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                {/* About/Qualifications Textarea - Light grey background, left-aligned */}
                <div>
                  <textarea
                    {...register("about")}
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border-0 bg-gray-100 text-[#3A3A3A] placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:bg-white transition-all resize-none text-left leading-relaxed"
                    placeholder="About staff member and qualifications"
                  />
                  {errors.about && (
                    <p className="text-red-500 text-xs mt-1.5 text-left">
                      {errors.about.message}
                    </p>
                  )}
                </div>

                {/* Qualifications (hidden but still in form data) */}
                <input
                  {...register("qualifications")}
                  type="hidden"
                />
              </form>
            </div>

            {/* ADD Button - Below the card, centered */}
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={handleSubmit(
                  (data) => {
                    console.log("Form validation passed, calling onSubmit");
                    onSubmit(data);
                  },
                  (errors) => {
                    console.log("Form validation failed:", errors);
                    const firstError = Object.values(errors)[0];
                    if (firstError) {
                      const errorMsg = firstError.message || "Please fix the form errors";
                      setError(errorMsg);
                      toast({
                        variant: "destructive",
                        title: "Validation Error",
                        description: errorMsg,
                      });
                    }
                  }
                )}
                disabled={isLoading}
                className="px-8 py-2.5 text-[#3A3A3A] hover:text-[#2a2a2a] font-semibold transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3A3A3A] mr-2 inline-block" />
                    Adding...
                  </>
                ) : (
                  "ADD"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

