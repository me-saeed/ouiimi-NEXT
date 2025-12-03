"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { staffCreateSchema, type StaffCreateInput } from "@/lib/validation";
import { z } from "zod";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

export default function AddStaffPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [businessId, setBusinessId] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Form schema without businessId (we add it dynamically)
  const formSchema = staffCreateSchema.omit({ businessId: true });
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
      console.log("Submitting staff data:", { ...data, businessId: foundBusinessId });

      const requestBody = {
        ...data,
        businessId: foundBusinessId,
      };
      
      console.log("Request body:", JSON.stringify(requestBody, null, 2));
      console.log("Making POST request to /api/staff...");

      const response = await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Staff API response status:", response.status);
      console.log("Staff API response headers:", Object.fromEntries(response.headers.entries()));
      
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
      
      // Show success message for 2 seconds before redirect
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Force redirect to staff page (not profile)
      console.log("Redirecting to /business/staff");
      router.push("/business/staff");
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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-10 space-y-4 animate-in fade-in slide-in-from-top-8 duration-500">
              <h1 className="text-4xl md:text-5xl font-bold text-foreground">
                Add Staff Member
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                Add a new team member to your business. Fill in their details below.
              </p>
            </div>

            {/* Form Card */}
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 md:p-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
              {error && (
                <Alert className="mb-6 border-red-200 bg-red-50/50 backdrop-blur-sm">
                  <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 border-green-200 bg-green-50/50 backdrop-blur-sm">
                  <AlertDescription className="text-green-800 font-medium">{success}</AlertDescription>
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
              className="space-y-6 md:space-y-8"
            >
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Full Name <span className="text-destructive">*</span>
                </label>
                <input
                  {...register("name")}
                  type="text"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  placeholder="Enter staff member's full name"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Photo URL <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <input
                  {...register("photo")}
                  type="url"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  placeholder="https://example.com/profile-photo.jpg"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Add a profile photo URL for this staff member
                </p>
                {errors.photo && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.photo.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  Qualifications <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <input
                  {...register("qualifications")}
                  type="text"
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-base"
                  placeholder="e.g., Certified Hair Stylist, Licensed Massage Therapist"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  List certifications, licenses, or specializations
                </p>
                {errors.qualifications && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.qualifications.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-foreground mb-2">
                  About <span className="text-muted-foreground text-xs font-normal">(Optional)</span>
                </label>
                <textarea
                  {...register("about")}
                  rows={6}
                  className="w-full px-4 py-3.5 rounded-xl border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none text-base leading-relaxed"
                  placeholder="Describe this staff member's experience, specialties, years of service, and any other relevant background information..."
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Provide a brief bio or description of the staff member
                </p>
                {errors.about && (
                  <p className="text-red-500 text-sm mt-1.5">
                    {errors.about.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  size="lg"
                  className="flex-1 h-12 rounded-xl btn-polished-primary shadow-lg hover:shadow-xl transition-all font-semibold"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Adding...
                    </>
                  ) : (
                    "Add Staff Member"
                  )}
                </Button>
                <Button
                  type="button"
                  onClick={() => router.back()}
                  variant="outline"
                  size="lg"
                  className="flex-1 h-12 rounded-xl border-2 font-semibold"
                >
                  Cancel
                </Button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

