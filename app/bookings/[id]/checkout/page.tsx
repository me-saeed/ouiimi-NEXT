"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState("");

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        loadBooking();
    }, [bookingId]);

    const loadBooking = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/bookings/${bookingId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBooking(data.booking);

                // If payment already initiated (has paymentIntentId/sessionId), redirect to Stripe immediately
                if (data.booking.paymentIntentId) {
                    console.log("Payment session already exists, redirecting to Stripe...");
                    handlePayment();
                }
            } else {
                setError("Failed to load booking details");
            }
        } catch (err) {
            setError("Failed to load booking details");
        } finally {
            setIsLoading(false);
        }
    };

    const handlePayment = async () => {
        setIsProcessing(true);
        setError("");

        try {
            const token = localStorage.getItem("token");

            // Create Stripe Checkout Session
            const response = await fetch("/api/payments/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ bookingId }),
            });

            if (!response.ok) {
                throw new Error("Failed to create checkout session");
            }

            const { url } = await response.json();

            // Redirect to Stripe Checkout
            window.location.href = url;
        } catch (err: any) {
            setError(err.message || "An error occurred");
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <PageLayout user={user}>
                <div className="min-h-screen bg-gray-50 py-12 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
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
    const platformFee = booking.platformFee || 1.99;
    const totalPayment = booking.depositAmount + platformFee;

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
                                <div className="flex justify-between text-sm">
                                    <span>Deposit (10%)</span>
                                    <span>${booking.depositAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span>Platform Fee</span>
                                    <span>${platformFee.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-bold text-lg border-t pt-2 text-[#EECFD1]">
                                    <span>Pay Now</span>
                                    <span>${totalPayment.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm text-gray-600">
                                    <span>Pay at Venue</span>
                                    <span>${booking.remainingAmount.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 pt-2">
                                    💡 You&apos;ll pay the remaining ${booking.remainingAmount.toFixed(2)} at the venue after service
                                </p>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
                            <h2 className="text-xl font-semibold border-b pb-3">Payment Details</h2>

                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-sm font-medium text-blue-900 mb-2">Secure Payment by Stripe</p>
                                    <p className="text-xs text-blue-700">
                                        You&apos;ll be redirected to Stripe&apos;s secure checkout page to complete your payment.
                                        We don&apos;t store your card details.
                                    </p>
                                </div>

                                <div className="bg-[#EECFD1]/10 border border-[#EECFD1] rounded-lg p-4">
                                    <p className="font-semibold text-lg text-center text-[#3A3A3A]">
                                        Pay ${totalPayment.toFixed(2)}
                                    </p>
                                </div>

                                <Button
                                    onClick={handlePayment}
                                    disabled={isProcessing}
                                    className="w-full h-12 bg-[#EECFD1] hover:bg-[#EECFD1]/90 text-white text-lg font-semibold"
                                >
                                    {isProcessing ? (
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                            Redirecting to Stripe...
                                        </div>
                                    ) : (
                                        `Proceed to Payment`
                                    )}
                                </Button>

                                <p className="text-xs text-center text-gray-500">
                                    Your payment is secured by Stripe. We do not store your card details.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
