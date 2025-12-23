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
import { AuthModal } from "@/components/ui/auth-modal";
import { useAuth } from "@/lib/contexts/AuthContext";
import { retryWithBackoff, isNetworkError, formatRetryMessage } from "@/lib/utils/retry";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function BusinessRegisterPage() {
  const router = useRouter();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryMessage, setRetryMessage] = useState("");
  const [canRetry, setCanRetry] = useState(false);

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

  // Check authentication and existing business
  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;

    // If not authenticated, show modal
    if (!isAuthenticated || !user) {
      setShowAuthModal(true);
      return;
    }

    // Check if user already has a business
    const checkExistingBusiness = async () => {
      try {
        const response = await fetch(
          `/api/business/search?userId=${user.id || user._id}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const businesses = data.data?.businesses || data.businesses;
          if (businesses && businesses.length > 0) {
            // Business exists, redirect to dashboard
            router.push("/business/dashboard");
          }
        }
      } catch (e) {
        console.error("Error checking existing business:", e);
      }
    };

    checkExistingBusiness();
  }, [user, isAuthenticated, authLoading, router]);

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

      // Ensure user is available from state
      if (!user || !user.id && !user._id) {
        setError("User not authenticated. Please sign in again.");
        setIsLoading(false);
        setTimeout(() => router.push("/signin"), 2000);
        return;
      }

      const userId = user.id || user._id;
      console.log("User ID:", userId);

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

      // Reset retry state
      setRetryCount(0);
      setRetryMessage("");
      setCanRetry(false);

      // Wrap API call with retry logic
      const { result } = await retryWithBackoff(
        async () => {
          const res = await fetch("/api/business/create", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: 'include',
            body: JSON.stringify(requestBody),
          });

          //Parse response
          let result;
          try {
            result = await res.json();
          } catch (jsonError) {
            console.error("Error parsing response JSON:", jsonError);
            throw new Error("Invalid response from server");
          }

          // Check for HTTP errors
          if (!res.ok) {
            const error: any = new Error(result.error || result.message || "Failed to create business account");
            error.status = res.status;
            error.info = result;
            throw error;
          }

          return { response: res, result };
        },
        {
          maxRetries: 3,
          initialDelay: 1000,
          maxDelay: 10000,
          onRetry: (attempt, error, delay) => {
            setRetryCount(attempt);
            const message = formatRetryMessage(attempt, 3, delay);
            setRetryMessage(message);
            console.log(`[Registration] ${message}`, error);
          },
          shouldRetry: (error) => {
            // Only retry network errors or 5xx errors
            const shouldRetry = isNetworkError(error);
            if (!shouldRetry) {
              console.log("[Registration] Not retrying error:", error.status, error.message);
            }
            return shouldRetry;
          },
        }
      );

      console.log("Business created successfully:", result);
      setError(""); // Clear any previous errors
      setRetryMessage("");
      setRetryCount(0);
      setIsLoading(false);

      // Show success message
      alert("Business registered successfully! Redirecting to dashboard...");

      // Immediate redirect
      router.push("/business/dashboard");

    } catch (err: any) {
      console.error("Business registration error:", err);
      console.error("Error stack:", err.stack);

      // Handle special case: business already exists
      if (err.info?.error?.includes("already have a business")) {
        setError("");
        setIsLoading(false);
        setRetryMessage("");
        alert("You already have a business registered. Redirecting to dashboard...");
        router.push("/business/dashboard");
        return;
      }

      // Check if this is a network error that could be retried
      if (isNetworkError(err)) {
        setError(err.message || "Network error occurred. Please check your connection.");
        setCanRetry(true); // Show retry button
      } else {
        // Validation error or other non-retryable error
        setError(err.message || "Failed to register business. Please check your information.");
        setCanRetry(false);
      }

      setRetryMessage("");
      setIsLoading(false);
    }
  };

  return (
    <PageLayout user={user || null}>
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message="You need to be signed in to create a business profile. Please sign in or create a new account to continue."
        redirectPath="/business/register"
        dismissible={true}
      />

      <div className="min-h-screen bg-gray-50/50 py-12 flex items-center justify-center">
        <div className="w-full max-w-2xl px-4 sm:px-6">
          {authLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="text-sm text-muted-foreground">Loading...</p>
            </div>
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

                {retryMessage && (
                  <Alert className="mb-8">
                    <AlertDescription className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      {retryMessage}
                    </AlertDescription>
                  </Alert>
                )}

                {canRetry && !isLoading && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleSubmit(onSubmit)()}
                    className="w-full mb-8"
                  >
                    🔄 Retry Registration
                  </Button>
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Website
                      </label>
                      <input
                        {...register("website")}
                        type="url"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        placeholder="https://www.yourbusiness.com"
                        disabled={isLoading}
                      />
                      {errors.website && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                          {errors.website.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Social Media
                      </label>
                      <input
                        {...register("socialMedia")}
                        type="text"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200"
                        placeholder="@yourbusiness or instagram.com/yourbusiness"
                        disabled={isLoading}
                      />
                      {errors.socialMedia && (
                        <p className="text-red-500 text-xs mt-1.5 font-medium flex items-center gap-1">
                          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
                          {errors.socialMedia.message}
                        </p>
                      )}
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

