"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { BookingsTab } from "@/components/business/BookingsTab";
import { ListTab } from "@/components/business/ListTab";
import { StaffTab } from "@/components/business/StaffTab";
import { DetailsTab } from "@/components/business/DetailsTab";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/contexts/AuthContext";
import { useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { ImageUpload } from "@/components/ui/image-upload";
import { useBusiness } from "@/lib/hooks/useBusiness";
import { BusinessDashboardSkeleton } from "@/components/skeletons/BusinessDashboardSkeleton";

export default function BusinessDashboardPage() {
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"bookings" | "list" | "staff" | "details">("bookings");

    // Use SWR hook for business data
    const { business, isLoading: businessLoading, error, mutate } = useBusiness(user?.id || user?._id);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Validate file type
            if (!file.type.startsWith("image/")) {
                return;
            }

            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Image size should be less than 5MB",
                });
                return;
            }

            const toastId = toast({
                title: "Uploading...",
                description: "Please wait while we upload your logo.",
            });

            try {
                const formData = new FormData();
                formData.append("file", file);

                const response = await fetch("/api/upload", {
                    method: "POST",
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                const data = await response.json();
                const logoUrl = data.url;

                // Update business with new logo
                const businessId = business._id || business.id;
                const updateResponse = await fetch(`/api/business/${businessId}`, {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: "include",
                    body: JSON.stringify({ logo: logoUrl }),
                });

                if (!updateResponse.ok) {
                    throw new Error("Failed to update business profile");
                }

                // Optimistically update SWR cache
                mutate();
                toast({
                    variant: "success",
                    title: "Success",
                    description: "Business logo updated successfully!",
                });

            } catch (err) {
                console.error("Error uploading image:", err);
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "Failed to upload image. Please try again.",
                });
            }
        }
    };

    // Check URL hash or query param for initial tab
    useEffect(() => {
        if (typeof window !== "undefined") {
            const hash = window.location.hash;
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get("tab") || hash.replace("#", "");

            if (tabParam && ["bookings", "list", "staff", "details"].includes(tabParam)) {
                setActiveTab(tabParam as "bookings" | "list" | "staff" | "details");
            }
        }
    }, []);

    // Redirect to signin if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated && typeof window !== 'undefined') {
            router.push("/signin");
        }
    }, [isAuthenticated, authLoading, router]);

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

    if (businessLoading) {
        return <BusinessDashboardSkeleton />;
    }

    if (!business) {
        return (
            <PageLayout user={user}>
                <div className="bg-white min-h-screen py-12">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center py-20">
                            <h2 className="text-2xl font-semibold mb-4">No Business Found</h2>
                            <p className="text-muted-foreground mb-6">
                                You need to register a business first to access the dashboard.
                            </p>
                            <Button variant="pink" size="lg" asChild>
                                <Link href="/business/register">Register Business</Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout user={user}>
            <div className="bg-background min-h-screen">
                {/* Header Section - Matching Shopper Profile */}
                <div className="bg-white py-8 border-b border-gray-100">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <ImageUpload
                                value={business?.logo}
                                onChange={async (url) => {
                                    try {
                                        const businessId = business._id || business.id;
                                        const updateResponse = await fetch(`/api/business/${businessId}`, {
                                            method: "PUT",
                                            headers: {
                                                "Content-Type": "application/json",
                                            },
                                            credentials: "include",
                                            body: JSON.stringify({ logo: url }),
                                        });

                                        if (updateResponse.ok) {
                                            // Refresh SWR cache
                                            mutate();
                                            toast({
                                                variant: "success",
                                                title: "Success",
                                                description: "Business logo updated successfully!",
                                            });
                                        } else {
                                            throw new Error("Failed to update business profile");
                                        }
                                    } catch (err) {
                                        console.error("Error updating logo:", err);
                                        toast({
                                            variant: "destructive",
                                            title: "Error",
                                            description: "Failed to update business logo",
                                        });
                                    }
                                }}
                                variant="avatar"
                            />

                            <h2 className="text-xl font-medium text-foreground">{business?.businessName}</h2>

                        </div>
                    </div>
                </div>


                {/* Business Approval Status Banner */}
                {business && business.status !== 'approved' && (
                    <div className="bg-white border-b border-gray-100 py-6">
                        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                            <div className={`rounded-xl border-2 p-6 ${business.status === 'pending' ? 'border-amber-300 bg-amber-50' :
                                business.status === 'rejected' ? 'border-red-300 bg-red-50' :
                                    'border-gray-300 bg-gray-50'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">
                                        {business.status === 'pending' && '⏳'}
                                        {business.status === 'rejected' && '❌'}
                                        {business.status === 'suspended' && '🚫'}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-lg font-bold mb-2 ${business.status === 'pending' ? 'text-amber-800' :
                                            business.status === 'rejected' ? 'text-red-800' :
                                                'text-gray-800'
                                            }`}>
                                            {business.status === 'pending' && 'Business Account Pending Approval'}
                                            {business.status === 'rejected' && 'Business Account Rejected'}
                                            {business.status === 'suspended' && 'Business Account Suspended'}
                                        </h3>
                                        <p className={`text-sm ${business.status === 'pending' ? 'text-amber-700' :
                                            business.status === 'rejected' ? 'text-red-700' :
                                                'text-gray-700'
                                            }`}>
                                            {business.status === 'pending' &&
                                                'Your business account is currently under review by our admin team. You can view your dashboard and manage bookings, but you cannot create new services until your account is approved. You will receive an email once your account is approved.'
                                            }
                                            {business.status === 'rejected' &&
                                                `Your business account has been rejected. ${business.adminNotes ? `Reason: ${business.adminNotes}` : 'Please contact support for more information.'}`
                                            }
                                            {business.status === 'suspended' &&
                                                `Your business account has been suspended. ${business.adminNotes ? `Reason: ${business.adminNotes}` : 'Please contact support for more information.'}`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main Navigation Tabs */}
                <div className="bg-white border-b border-border/50 sticky top-16 z-10 shadow-sm">
                    <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-center w-full max-w-4xl mx-auto">
                            <button
                                onClick={() => setActiveTab("bookings")}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors relative ${activeTab === "bookings"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Bookings
                                {activeTab === "bookings" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("list")}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors relative ${activeTab === "list"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Services
                                {activeTab === "list" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("staff")}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors relative ${activeTab === "staff"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Staff
                                {activeTab === "staff" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab("details")}
                                className={`flex-1 py-3 md:py-4 text-xs md:text-sm font-medium transition-colors relative ${activeTab === "details"
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                    }`}
                            >
                                Details
                                {activeTab === "details" && (
                                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    {activeTab === "bookings" && <BookingsTab business={business} />}
                    {activeTab === "list" && <ListTab business={business} />}
                    {activeTab === "staff" && <StaffTab business={business} />}
                    {activeTab === "details" && <DetailsTab business={business} />}
                </div>
            </div>
        </PageLayout>
    );
}



