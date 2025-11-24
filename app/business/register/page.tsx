"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessCreateSchema, type BusinessCreateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Omit<BusinessCreateInput, "userId">>({
    resolver: zodResolver(businessCreateSchema.omit({ userId: true })),
    mode: "onChange",
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const checkAuth = () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          setIsCheckingAuth(false);
        } catch (e) {
          console.error("Error parsing user data:", e);
          setIsCheckingAuth(false);
          router.push("/signin");
        }
      } else {
        setIsCheckingAuth(false);
        router.push("/signin");
      }
    };

    checkAuth();
  }, [router]);

  const onSubmit = async (data: Omit<BusinessCreateInput, "userId">) => {
    console.log("Form submitted with data:", data);
    setIsLoading(true);
    setError("");

    try {
      // Client-side validation (additional to Zod)
      if (!data.businessName || data.businessName.trim().length < 2) {
        setError("Business name must be at least 2 characters");
        setIsLoading(false);
        return;
      }
      
      if (!data.email || !data.email.includes("@")) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
      
      if (!data.address || data.address.trim().length < 5) {
        setError("Address must be at least 5 characters");
        setIsLoading(false);
        return;
      }

      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      console.log("Token exists:", !!token);
      console.log("User data exists:", !!userData);
      
      if (!token || !userData) {
        setError("Please sign in to register a business");
        setIsLoading(false);
        setTimeout(() => router.push("/signin"), 2000);
        return;
      }

      let parsedUser;
      try {
        parsedUser = JSON.parse(userData);
      } catch (parseError) {
        console.error("Error parsing user data:", parseError);
        setError("Invalid user data. Please sign in again.");
        setIsLoading(false);
        setTimeout(() => router.push("/signin"), 2000);
        return;
      }

      const userId = parsedUser.id || parsedUser._id;
      console.log("User ID:", userId);

      if (!userId) {
        setError("User ID not found. Please sign in again.");
        setIsLoading(false);
        setTimeout(() => router.push("/signin"), 2000);
        return;
      }

      // Prepare request body with all required fields, trimming strings
      const requestBody = {
        userId: String(userId), // Ensure it's a string
        businessName: (data.businessName || "").trim(),
        email: (data.email || "").trim(),
        phone: data.phone ? data.phone.trim() : undefined,
        address: (data.address || "").trim(),
        story: data.story ? data.story.trim() : undefined,
      };

      console.log("Submitting business registration:", requestBody);
      
      // Final validation before sending
      if (!requestBody.businessName || requestBody.businessName.length < 2) {
        setError("Business name must be at least 2 characters");
        setIsLoading(false);
        return;
      }
      
      if (!requestBody.email || !requestBody.email.includes("@")) {
        setError("Please enter a valid email address");
        setIsLoading(false);
        return;
      }
      
      if (!requestBody.address || requestBody.address.length < 5) {
        setError("Address must be at least 5 characters");
        setIsLoading(false);
        return;
      }

      // Make the API call
      const response = await fetch("/api/business/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      }).catch((fetchError) => {
        console.error("Fetch error:", fetchError);
        throw new Error("Network error. Please check your connection and try again.");
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      let result;
      try {
        result = await response.json();
        console.log("Business registration response:", result);
      } catch (jsonError) {
        console.error("Error parsing response JSON:", jsonError);
        const text = await response.text();
        console.error("Response text:", text);
        setError("Invalid response from server. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        let errorMsg = "Failed to create business account";
        
        if (result.error) {
          errorMsg = result.error;
        } else if (result.details) {
          errorMsg = typeof result.details === 'string' 
            ? result.details 
            : JSON.stringify(result.details);
        } else if (result.message) {
          errorMsg = result.message;
        }
        
        console.error("Business registration failed:", errorMsg);
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log("Business created successfully:", result);
      setError(""); // Clear any previous errors
      
      // Show success message
      alert("Business registered successfully! Redirecting to dashboard...");
      
      // Redirect after a short delay
      setTimeout(() => {
        router.push("/business/dashboard");
      }, 500);
      
    } catch (err: any) {
      console.error("Business registration error:", err);
      console.error("Error stack:", err.stack);
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <PageLayout user={user || null}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            {isCheckingAuth ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
              </div>
            ) : !user ? (
              <div className="text-center py-20">
                <p className="text-[#3A3A3A] mb-4">Please sign in to register your business.</p>
                <Button
                  onClick={() => router.push("/signin")}
                  className="btn-polished btn-polished-primary"
                >
                  Go to Sign In
                </Button>
              </div>
            ) : (
              <>
                <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8">
                  Register Your Business
                </h1>

            {error && (
              <Alert className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form 
              onSubmit={handleSubmit(
                async (data) => {
                  console.log("Form validation passed, calling onSubmit");
                  setError(""); // Clear any previous errors
                  await onSubmit(data);
                },
                (validationErrors) => {
                  console.error("Form validation errors:", validationErrors);
                  // Show first validation error with field name
                  const errorFields = Object.keys(validationErrors);
                  if (errorFields.length > 0) {
                    const firstField = errorFields[0];
                    const firstError = validationErrors[firstField as keyof typeof validationErrors];
                    if (firstError && firstError.message) {
                      setError(`${firstField}: ${firstError.message}`);
                    } else {
                      setError(`Please fix the ${firstField} field`);
                    }
                  } else {
                    setError("Please fix the form errors before submitting");
                  }
                }
              )} 
              className="space-y-6"
            >
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
                  Business Story
                </label>
                <textarea
                  {...register("story")}
                  rows={4}
                  className="input-polished resize-none"
                  placeholder="Tell us about your business..."
                />
                {errors.story && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.story.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-polished btn-polished-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating..." : "Register Business"}
              </button>
            </form>
              </>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

