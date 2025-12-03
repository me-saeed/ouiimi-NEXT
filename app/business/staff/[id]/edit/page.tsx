"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffUpdateSchema, type StaffUpdateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function EditStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingStaff, setIsLoadingStaff] = useState(true);

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
        setValue("about", data.staff.about || "");
      }
    } catch (err: any) {
      setError("Failed to load staff member");
      console.error("Error loading staff:", err);
    } finally {
      setIsLoadingStaff(false);
    }
  };

  const onSubmit = async (data: StaffUpdateInput) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
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
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8">
              Edit Staff Member
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
                  {isLoading ? "Updating..." : "Update Staff Member"}
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

