"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessUpdateSchema, type BusinessUpdateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BusinessProfileEditPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<BusinessUpdateInput>({
    resolver: zodResolver(businessUpdateSchema),
  });

  useEffect(() => {
    const loadBusinessData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/signin");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const userId = parsedUser.id || parsedUser._id;

        // Fetch business by userId
        const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          if (businessData.businesses && businessData.businesses.length > 0) {
            const businessItem = businessData.businesses[0];
            setBusiness(businessItem);

            // Populate form with existing data
            reset({
              businessName: businessItem.businessName || "",
              email: businessItem.email || "",
              phone: businessItem.phone || "",
              address: businessItem.address || "",
              story: businessItem.story || "",
              logo: businessItem.logo || "",
            });
          } else {
            setError("Business not found. Please register your business first.");
          }
        } else {
          setError("Failed to load business data.");
        }
      } catch (e) {
        console.error("Error loading business data:", e);
        setError("Failed to load business data.");
      } finally {
        setIsLoadingData(false);
      }
    };

    loadBusinessData();
  }, [router, reset]);

  const onSubmit = async (data: BusinessUpdateInput) => {
    if (!business) {
      setError("Business not found");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const businessId = business._id || business.id;

      const response = await fetch(`/api/business/${businessId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to update business");
        setIsLoading(false);
        return;
      }

      setSuccess("Business profile updated successfully!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/business/dashboard");
      }, 2000);
    } catch (err: any) {
      console.error("Error updating business:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (isLoadingData) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!business) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto">
              <Alert className="mb-6">
                <AlertDescription>
                  Business not found. Please register your business first.
                </AlertDescription>
              </Alert>
              <button
                onClick={() => router.push("/business/register")}
                className="btn-polished btn-polished-primary"
              >
                Register Business
              </button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-background min-h-screen">
        {/* Profile Header - Light Pink Background */}
        <div className="bg-secondary/30 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="relative">
                {business?.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={business.logo}
                    alt={business.businessName}
                    className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                    <span className="text-2xl font-bold text-muted-foreground">
                      {business?.businessName?.charAt(0) || "B"}
                    </span>
                  </div>
                )}
                <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold hover:bg-primary/90">
                  +
                </button>
              </div>

              <h2 className="text-xl font-medium text-foreground">{business?.businessName}</h2>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-[#3A3A3A]">
                Edit Business Profile
              </h1>
              <button
                onClick={() => router.back()}
                className="btn-polished btn-polished-secondary"
              >
                Cancel
              </button>
            </div>

            {error && (
              <Alert className="mb-6 border-red-200 bg-red-50">
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
                  Business Name *
                </label>
                <input
                  {...register("businessName")}
                  type="text"
                  className="input-polished"
                  placeholder="Enter business name"
                />
                {errors.businessName && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.businessName.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Email *
                </label>
                <input
                  {...register("email")}
                  type="email"
                  className="input-polished"
                  placeholder="business@example.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Phone
                </label>
                <input
                  {...register("phone")}
                  type="tel"
                  className="input-polished"
                  placeholder="+61 4XX XXX XXX"
                />
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.phone.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Address *
                </label>
                <input
                  {...register("address")}
                  type="text"
                  className="input-polished"
                  placeholder="123 Main St, City, State"
                />
                {errors.address && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Logo URL
                </label>
                <input
                  {...register("logo")}
                  type="url"
                  className="input-polished"
                  placeholder="https://example.com/logo.png"
                />
                {errors.logo && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.logo.message}
                  </p>
                )}
                {business.logo && (
                  <div className="mt-3">
                    <p className="text-sm text-[#3A3A3A]/70 mb-2">Current Logo:</p>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={business.logo}
                      alt="Business logo"
                      className="w-24 h-24 rounded-lg object-cover border border-gray-300"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Business Story
                </label>
                <textarea
                  {...register("story")}
                  rows={6}
                  className="input-polished resize-none"
                  placeholder="Tell us about your business..."
                />
                {errors.story && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.story.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-polished btn-polished-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? "Updating..." : "Update Profile"}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 btn-polished btn-polished-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

