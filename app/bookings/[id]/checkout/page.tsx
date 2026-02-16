"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import PageLayout from "@/components/layout/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/contexts/AuthContext";
import StripeProvider from "@/components/payments/StripeProvider";
import CheckoutForm from "@/components/payments/CheckoutForm";
import { DEPOSIT_PERCENTAGE, PLATFORM_FEE } from "@/lib/constants/pricing";

import { ApiBooking } from "@/lib/types/api";

export default function CheckoutPage() {
    const params = useParams();
    const router = useRouter();
    const { user, isAuthenticated, isLoading: authLoading } = useAuth();
    const bookingId = params.id as string;

    const [booking, setBooking] = useState<ApiBooking | null>(null);
    const [clientSecret, setClientSecret] = useState<string>("");
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    // Redirect if not authenticated
    useEffect(() => {
        if (!authLoading && !isAuthenticated) {
            const returnUrl = encodeURIComponent(`/bookings/${bookingId}/checkout`);
            router.push(`/signin?redirect=${returnUrl}`);
        }
    }, [authLoading, isAuthenticated, router, bookingId]);

    // Load booking and create payment intent
    useEffect(() => {
        const initializeCheckout = async () => {
            try {
                setIsLoading(true);

                // Add timeout to prevent infinite loading
                const timeout = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error("Request timed out")), 15000)
                );

                // First, load booking details (session cookie sent automatically)
                const bookingPromise = fetch(`/api/bookings/${bookingId}`, {
                    credentials: 'include', // Sends session cookie
                });

                const bookingResponse = await Promise.race([bookingPromise, timeout]) as Response;

                if (!bookingResponse.ok) {
                    const errorText = await bookingResponse.text();
                    setError(errorText || "Failed to load booking details");
                    setIsLoading(false);
                    return;
                }

                const bookingData = await bookingResponse.json();
                const booking = bookingData.data?.booking || bookingData.booking;

                // If already paid, redirect to confirmation immediately
                if (booking.paymentStatus === 'deposit_paid' || booking.status === 'confirmed') {
                    router.push(`/bookings/${bookingId}/confirm`);
                    return;
                }

                setBooking(booking);

                // Then, create payment intent for embedded checkout
                const intentPromise = fetch("/api/payments/create-intent", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    credentials: 'include', // Sends session cookie
                    body: JSON.stringify({ bookingId }),
                });

                const intentResponse = await Promise.race([intentPromise, timeout]) as Response;

                if (!intentResponse.ok) {
                    throw new Error("Failed to initialize payment");
                }

                const intentData = await intentResponse.json();
                setClientSecret(intentData.clientSecret);
                setPaymentAmount(intentData.amount || (booking.depositAmount + PLATFORM_FEE));
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
    }, [bookingId, authLoading, isAuthenticated, router]);

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
            <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8 sm:py-12">
                <div className="container mx-auto px-4 max-w-7xl">
                    {/* Modern Header */}
                    <div className="mb-8 sm:mb-12">
                        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Secure Checkout</h1>
                        <p className="text-sm md:text-base text-gray-600">Complete your booking payment safely and securely</p>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6 rounded-2xl">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
                        {/* Left Card: Booking Summary */}
                        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="space-y-6">
                                {/* Header with Business Info */}
                                <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                                    <div className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 rounded-2xl border-2 border-gray-100 flex items-center justify-center bg-gradient-to-br from-gray-50 to-white shadow-sm overflow-hidden flex-shrink-0">
                                        {business?.logo ? (
                                            <div className="relative w-full h-full">
                                                <Image
                                                    src={business.logo}
                                                    alt={business.businessName}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-50" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">{business?.businessName || "Business"}</h2>
                                        <p className="text-xs md:text-sm text-gray-500 mt-1">Booking Summary</p>
                                    </div>
                                </div>

                                {/* Booking Details */}
                                <div className="space-y-5">
                                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                                            <p className="text-sm md:text-base font-semibold text-gray-900">
                                                {new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                                            <p className="text-sm md:text-base font-semibold text-gray-900">
                                                {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-700 font-medium">{service?.serviceName}</span>
                                            <span className="text-gray-900 font-semibold">${booking.baseCost || booking.totalCost - (booking.addOns?.reduce((acc: number, curr: any) => acc + curr.cost, 0) || 0)}</span>
                                        </div>

                                        {booking.addOns && booking.addOns.length > 0 && (
                                            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                                                {booking.addOns.map((addon: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-center text-sm">
                                                        <span className="text-gray-600">+ {addon.name}</span>
                                                        <span className="text-gray-700 font-medium">${addon.cost}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-3 border-t border-gray-200">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-700 font-semibold">Service Total</span>
                                                <span className="text-xl font-bold text-gray-900">${booking.totalCost}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-t border-gray-200 pt-6 mt-6">
                                    <div className="bg-gradient-to-br from-[#EECFD1]/10 to-[#EECFD1]/5 rounded-2xl p-5 space-y-3">
                                        <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Payment Breakdown</h3>
                                        <div className="space-y-2">


                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600">{DEPOSIT_PERCENTAGE * 100}% Deposit</span>
                                                <span className="font-semibold text-gray-900">${booking.depositAmount}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-600 flex items-center gap-1">
                                                    Platform Fee
                                                    <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full">Non-refundable</span>
                                                </span>
                                                <span className="font-semibold text-gray-900">${PLATFORM_FEE}</span>
                                            </div>
                                            <div className="pt-3 border-t border-gray-300 mt-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-lg font-bold text-gray-900">Total Today</span>
                                                    <span className="text-2xl md:text-3xl font-extrabold text-gray-900">${(booking.depositAmount + PLATFORM_FEE).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                                            💡 Remaining ${booking.remainingAmount} paid directly to business at appointment
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Card: Payment Form */}
                        <div className="bg-white rounded-3xl border border-gray-200 p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow duration-300">
                            <div className="space-y-6">
                                {/* Section Header */}
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-xl md:text-2xl font-bold text-gray-900">Payment Details</h2>
                                    <p className="text-xs md:text-sm text-gray-500 mt-1">Enter your information to complete the booking</p>
                                </div>

                                {/* Customer Info Fields */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <Input
                                            className="w-full h-10 md:h-12 rounded-xl border-gray-300 bg-gray-50 text-sm md:text-base text-gray-900 font-medium"
                                            value={user?.fname + " " + (user?.lname || "")}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                        <Input
                                            className="w-full h-10 md:h-12 rounded-xl border-gray-300 bg-gray-50 text-sm md:text-base text-gray-900 font-medium"
                                            value={user?.email}
                                            readOnly
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <Input
                                            className="w-full h-10 md:h-12 rounded-xl border-gray-300 bg-white text-sm md:text-base focus:border-[#EECFD1] focus:ring-[#EECFD1]"
                                            value={user?.phone || ""}
                                            placeholder="Enter your phone number"
                                        />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">Card Information</h3>
                                    {clientSecret ? (
                                        <StripeProvider clientSecret={clientSecret} amount={paymentAmount}>
                                            <CheckoutForm
                                                bookingId={bookingId}
                                                amount={paymentAmount}
                                                onSuccess={handlePaymentSuccess}
                                                layoutType="compact"
                                            />
                                        </StripeProvider>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1] mx-auto mb-4"></div>
                                            <p className="text-sm text-gray-600">Loading secure payment form...</p>
                                        </div>
                                    )}
                                </div>

                                {/* Security Badge */}
                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500 bg-gray-50 py-3 rounded-lg border border-gray-100">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                        <span className="font-medium">Protected by Stripe 256-bit Encryption</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
