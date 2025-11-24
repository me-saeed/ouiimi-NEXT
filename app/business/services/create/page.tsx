"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { serviceCreateSchema, type ServiceCreateInput } from "@/lib/validation";
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

export default function CreateServicePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ServiceCreateInput>({
    resolver: zodResolver(serviceCreateSchema),
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

  const onSubmit = async (data: ServiceCreateInput) => {
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

      const response = await fetch("/api/services", {
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
        setError(result.error || "Failed to create service");
        setIsLoading(false);
        return;
      }

      router.push("/business/services");
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
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
              Create Service
            </h1>

            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
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

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-polished btn-polished-primary"
                >
                  {isLoading ? "Creating..." : "Create Service"}
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

