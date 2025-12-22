"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/contexts/AuthContext";
import StripeProvider from "@/components/payments/StripeProvider";
import CheckoutForm from "@/components/payments/CheckoutForm";

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            const returnUrl = encodeURIComponent(`/bookings/${bookingId}/checkout`);
            router.push(`/signin?callbackUrl=${returnUrl}`);
        }
    }, [authLoading, isAuthenticated, router, bookingId]);

    // Load booking and create payment intent
    useEffect(() => {
        const initializeCheckout = async () => {
            try {
                setIsLoading(true);
                const token = localStorage.getItem("token");

                if (!token) {
                    setError("Authentication required");
                    setIsLoading(false);
                    return;
                }

                // Add timeout to prevent infinite loading
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 15000)
                );

                // First, load booking details
                const bookingPromise = fetch(`/api/bookings/${bookingId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });

                const bookingResponse = await Promise.race([bookingPromise, timeout]) as Response;

                if (!bookingResponse.ok) {
                    const errorText = await bookingResponse.text();
                    setError(errorText || "Failed to load booking details");
                    setIsLoading(false);
                    return;
                }

                const bookingData = await bookingResponse.json();
                setBooking(bookingData.booking);

                // Then, create payment intent for embedded checkout
                const intentPromise = fetch("/api/payments/create-intent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ bookingId }),
                });

                const intentResponse = await Promise.race([intentPromise, timeout]) as Response;

                if (!intentResponse.ok) {
                    throw new Error("Failed to initialize payment");
                }

                const intentData = await intentResponse.json();
                setClientSecret(intentData.clientSecret);
                setPaymentAmount(intentData.amount || bookingData.booking.depositAmount);
            } catch (err: any) {
                console.error("Checkout initialization error:", err);
                setError(err.message || "Failed to initialize checkout. Please try again.");
            } finally {
                setIsLoading(false);
            }
        };

        if (!authLoading && isAuthenticated) {
            initializeCheckout();
        } else if (!authLoading) {
            // Auth finished loading but user not authenticated - stop loading
            setIsLoading(false);
        }
    }, [bookingId, authLoading, isAuthenticated]);

    const handlePaymentSuccess = () => {
        router.push(`/bookings/${bookingId}/confirm`);
    };

    if (isLoading) {
        return (
            <PageLayout user={user}>
                <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1] mx-auto mb-4"></div>
                        <p className="text-gray-600">Preparing secure checkout...</p>
                    </div>
                </div>
            </PageLayout>
        );
    }

    if (!booking) {
        return (
            <PageLayout user={user}>
                <div className="min-h-screen bg-gray-50 py-12">
                    <div className="container mx-auto px-4 max-w-2xl">
                        <Alert variant="destructive">
                            <AlertDescription>Booking not found</AlertDescription>
                        </Alert>
                    </div>
                </div>
            </PageLayout>
        );
    }

    const service = typeof booking.serviceId === "object" ? booking.serviceId : null;
    const business = typeof booking.businessId === "object" ? booking.businessId : null;

    return (
        <PageLayout user={user}>
            <div className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-3xl font-bold text-center mb-8">Complete Your Booking</h1>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Booking Summary */}
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-3">Booking Summary</h2>

                            <div>
                                <p className="text-sm text-gray-600">Service</p>
                                <p className="font-medium">{service?.serviceName || "Service"}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Business</p>
                                <p className="font-medium">{business?.businessName || "Business"}</p>
                            </div>

                            <div>
                                <p className="text-sm text-gray-600">Date & Time</p>
                                <p className="font-medium">
                                    {new Date(booking.timeSlot.date).toLocaleDateString("en-US", {
                                        weekday: "long",
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <p className="text-sm text-gray-600">
                                    {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                                </p>
                            </div>

                            <div className="border-t pt-4 space-y-2">
                                <h3 className="font-semibold mb-3">Payment Breakdown</h3>
                                <div className="flex justify-between text-sm">
                                    <span>Total Service Cost</span>
                                    <span>${booking.totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 text-[#EECFD1]">
                                    <span>Pay Now (10% Deposit)</span>
                                    <span>${booking.depositAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Pay at Venue (90%)</span>
                                    <span>${booking.remainingAmount.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 pt-2">
                                    💡 You&apos;ll pay the remaining ${booking.remainingAmount.toFixed(2)} at the venue after service
                                </p>
                            </div>
                        </div>

                        {/* Payment Form - Embedded Stripe Elements */}
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-3">Payment Details</h2>

                            {clientSecret ? (
                                <StripeProvider clientSecret={clientSecret} amount={paymentAmount}>
                                    <CheckoutForm
                                        bookingId={bookingId}
                                        amount={paymentAmount}
                                        onSuccess={handlePaymentSuccess}
                                    />
                                </StripeProvider>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1] mx-auto mb-3"></div>
                                    <p className="text-sm text-gray-600">Loading payment form...</p>
                                </div>
                            )}

                            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                <p className="text-sm text-green-800 flex items-center gap-2">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                    </svg>
                                    Secure payment powered by Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
