"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffUpdateSchema, type StaffUpdateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus } from "lucide-react";

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<StaffUpdateInput>({
    resolver: zodResolver(staffUpdateSchema),
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadStaff();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, staffId]);

  const loadStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/${staffId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        setError("Failed to load staff member");
        setIsLoadingStaff(false);
        return;
      }

      const data = await response.json();
      if (data.staff) {
        setValue("name", data.staff.name);
        setValue("photo", data.staff.photo || "");
        setValue("qualifications", data.staff.qualifications || "");
        setValue("about", data.staff.about || data.staff.bio || "");
        if (data.staff.photo) {
          setImagePreview(data.staff.photo);
        }
      }
    } catch (err: any) {
      setError("Failed to load staff member");
      console.error("Error loading staff:", err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

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

  const onSubmit = async (data: StaffUpdateInput) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      
      // Convert image to base64 if selected
      let photoUrl = data.photo || "";
      if (selectedImage) {
        photoUrl = await convertImageToBase64(selectedImage);
      }

      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          photo: photoUrl || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update staff member");
        setIsLoading(false);
        return;
      }

      setSuccess("Staff member updated successfully! Redirecting...");
      setTimeout(() => {
        router.push("/business/staff");
      }, 1000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (!user || isLoadingStaff) {
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
      <div className="bg-white min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-md mx-auto">
            {/* Title - Above the card */}
            <h1 className="text-xl font-semibold text-[#3A3A3A] mb-4">EDIT</h1>

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
                onSubmit={handleSubmit(onSubmit)} 
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

                {/* Qualifications - Store in hidden field, combine with about for display */}
                <input
                  {...register("qualifications")}
                  type="hidden"
                />
              </form>
            </div>

            {/* UPDATE Button - Below the card, centered */}
            <div className="mt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={handleSubmit(onSubmit)}
                disabled={isLoading}
                className="px-8 py-2.5 rounded-lg bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] font-semibold transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                    Updating...
                  </>
                ) : (
                  "UPDATE"
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-8 py-2.5 rounded-lg bg-gray-200 text-[#3A3A3A] hover:bg-gray-300 font-semibold transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

