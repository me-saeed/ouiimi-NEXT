"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { businessCreateSchema, type BusinessCreateInput } from "@/lib/validation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AddressAutocomplete } from "@/components/ui/address-autocomplete";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<Omit<BusinessCreateInput, "userId">>({
    resolver: zodResolver(businessCreateSchema.omit({ userId: true })),
    mode: "onChange",
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    const checkAuth = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      if (token && userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Check if business already exists
          const userId = parsedUser.id || parsedUser._id;
          if (userId) {
            try {
              const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });

              if (businessResponse.ok) {
                const businessData = await businessResponse.json();
                if (businessData.businesses && businessData.businesses.length > 0) {
                  // Business exists, redirect to dashboard
                  router.push("/business/dashboard");
                  return;
                }
              }
            } catch (e) {
              console.error("Error checking business:", e);
            }
          }

          setIsCheckingAuth(false);
        } catch (e) {
          console.error("Error parsing user data:", e);
          setIsCheckingAuth(false);
          router.push("/signin?redirect=/business/register");
        }
      } else {
        setIsCheckingAuth(false);
        router.push("/signin?redirect=/business/register");
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

      if (!data.address || (typeof data.address === 'string' && data.address.trim().length < 5)) {
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
        address: typeof data.address === 'string' ? data.address.trim() : data.address,
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


      if (!requestBody.address || (typeof requestBody.address === 'string' && requestBody.address.length < 5)) {
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

        // If business already exists, redirect to dashboard instead of showing error
        if (result.error && result.error.includes("already have a business")) {
          setError("");
          setIsLoading(false);
          alert("You already have a business registered. Redirecting to dashboard...");
          router.push("/business/dashboard");
          return;
        }

        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      console.log("Business created successfully:", result);
      setError(""); // Clear any previous errors
      setIsLoading(false);

      // Show success message
      alert("Business registered successfully! Redirecting to dashboard...");

      // Immediate redirect
      router.push("/business/dashboard");

    } catch (err: any) {
      console.error("Business registration error:", err);
      console.error("Error stack:", err.stack);
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <PageLayout user={user || null}>
      <div className="min-h-screen bg-gray-50/50 py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4 sm:px-6">
          {isCheckingAuth ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Verifying access...</p>
            </div>
          ) : !user ? (
            <Card className="w-full shadow-lg border-0 bg-white">
              <CardHeader className="text-center space-y-2 pb-8 pt-10">
                <CardTitle className="text-2xl font-bold text-gray-900">Authentication Required</CardTitle>
                <CardDescription className="text-base">
                  Please sign in to continue with business registration.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-10">
                <Button
                  onClick={() => router.push("/signin?redirect=/business/register")}
                  className="btn-polished btn-polished-primary min-w-[200px]"
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="w-full shadow-lg border-0 bg-white overflow-hidden">
              <CardHeader className="space-y-1 text-center bg-white pb-8 pt-10 px-6 sm:px-10 border-b border-gray-100/50">
                <CardTitle className="text-3xl font-bold tracking-tight text-gray-900">
                  Register Your Business
                </CardTitle>
                <CardDescription className="text-base text-gray-500 max-w-md mx-auto">
                  Create your business profile to start managing services and bookings on Ouiimi.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 sm:p-10">
                {error && (
                  <Alert variant="destructive" className="mb-8 border-red-100 bg-red-50/50">
                    <AlertDescription className="text-red-600 font-medium">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <form
                  onSubmit={handleSubmit(
                    async (data) => {
                      setError("");
                      await onSubmit(data);
                    },
                    (validationErrors) => {
                      const errorFields = Object.keys(validationErrors);
                      if (errorFields.length > 0) {
                        const firstField = errorFields[0];
                        const firstError = validationErrors[firstField as keyof typeof validationErrors];
                        setError(firstError?.message || `Please fix the ${firstField} field`);
                      }
                    }
                  )}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Business Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("businessName")}
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        placeholder="e.g. Luxe Salon"
                        disabled={isLoading}
                      />
                      {errors.businessName && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                          {errors.businessName.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        {...register("email")}
                        type="email"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        placeholder="contact@business.com"
                        disabled={isLoading}
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                          {errors.email.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Phone Number
                      </label>
                      <input
                        {...register("phone")}
                        type="tel"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        placeholder="+61 4XX XXX XXX"
                        disabled={isLoading}
                      />
                      {errors.phone && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <AddressAutocomplete
                        control={control}
                        name="address"
                        placeholder="Search for address..."
                        error={errors.address?.message}
                        required
                        returnObject={true}
                        setValue={setValue}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      About Your Business
                    </label>
                    <textarea
                      {...register("story")}
                      rows={5}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none transition-all duration-200"
                      placeholder="Tell customers what makes your business special..."
                      disabled={isLoading}
                    />
                    {errors.story && (
                      <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                        {errors.story.message}
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-11 text-base font-semibold shadow-md active:scale-[0.98] transition-all duration-200"
                    >
                      {isLoading ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                          Creating Account...
                        </span>
                      ) : (
                        "Register Business"
                      )}
                    </Button>
                    <p className="text-xs text-center text-gray-500 mt-4">
                      By registering, you agree to our Terms of Service and Privacy Policy.
                    </p>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

