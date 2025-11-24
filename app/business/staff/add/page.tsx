"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffCreateSchema, type StaffCreateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function AddStaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StaffCreateInput>({
    resolver: zodResolver(staffCreateSchema),
  });

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

  const onSubmit = async (data: StaffCreateInput) => {
    setIsLoading(true);
    setError("");

    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      const parsedUser = JSON.parse(userData || "{}");
      const userId = parsedUser.id || parsedUser._id;

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

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...data,
          businessId: foundBusinessId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.details || "Failed to add staff member";
        setError(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
        setIsLoading(false);
        return;
      }

      // Success - redirect to staff list
      router.push("/business/staff");
    } catch (err: any) {
      console.error("Staff creation error:", err);
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8">
              Add Staff Member
            </h1>

            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Name *
                </label>
                <input
                  {...register("name")}
                  type="text"
                  className="input-polished"
                  placeholder="John Doe"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Photo URL
                </label>
                <input
                  {...register("photo")}
                  type="url"
                  className="input-polished"
                  placeholder="https://example.com/photo.jpg"
                />
                {errors.photo && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.photo.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  Qualifications
                </label>
                <input
                  {...register("qualifications")}
                  type="text"
                  className="input-polished"
                  placeholder="Certified Hair Stylist"
                />
                {errors.qualifications && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.qualifications.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#3A3A3A] mb-2.5">
                  About
                </label>
                <textarea
                  {...register("about")}
                  rows={4}
                  className="input-polished resize-none"
                  placeholder="Tell us about this staff member..."
                />
                {errors.about && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.about.message}
                  </p>
                )}
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-polished btn-polished-primary"
                >
                  {isLoading ? "Adding..." : "Add Staff Member"}
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

