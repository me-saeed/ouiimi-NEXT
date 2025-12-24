"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
                setPaymentAmount(intentData.amount || booking.depositAmount);
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
            <div className="min-h-screen bg-[#FDFCFD] py-12">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="mb-8">
                        <div className="inline-block border border-green-600 px-4 py-1">
                            <h1 className="text-xl font-medium">Cart view</h1>
                        </div>
                    </div>

                    {error && (
                        <Alert variant="destructive" className="mb-6">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
                        {/* Left Card: Booking Summary */}
                        <div className="w-full max-w-[500px] bg-white rounded-[40px] border border-gray-200 p-8 sm:p-12 relative overflow-hidden shadow-sm">
                            <div className="space-y-6">
                                {/* Header with Logo Placeholder */}
                                <div className="flex items-center gap-6 mb-8">
                                    <div className="w-20 h-20 rounded-full border border-gray-100 flex items-center justify-center bg-white shadow-sm overflow-hidden flex-shrink-0">
                                        {business?.logo ? (
                                            <img src={business.logo} alt={business.businessName} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-gray-50" />
                                        )}
                                    </div>
                                    <h2 className="text-xl font-medium text-gray-700">{business?.businessName || "Business Name"}</h2>
                                </div>

                                {/* Details Grid */}
                                <div className="space-y-4 text-[#4A4A4A]">
                                    <div className="flex justify-between items-baseline gap-4">
                                        <span className="text-lg">Date: {new Date(booking.timeSlot.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '.')}</span>
                                        <span className="text-lg">Time: {booking.timeSlot.startTime.toLowerCase().replace(/ /g, '')} am – {booking.timeSlot.endTime.toLowerCase().replace(/ /g, '')}pm</span>
                                    </div>

                                    <div className="flex justify-between items-baseline gap-4">
                                        <span className="text-lg">Service: {service?.serviceName}</span>
                                        <span className="text-lg">Cost: ${booking.baseCost || booking.totalCost - (booking.addOns?.reduce((acc: any, curr: any) => acc + curr.cost, 0) || 0)}</span>
                                    </div>

                                    {booking.addOns && booking.addOns.length > 0 && (
                                        <div className="flex items-start gap-4">
                                            <span className="text-lg whitespace-nowrap">Add-Ons:</span>
                                            <div className="flex-1 space-y-1">
                                                {booking.addOns.map((addon: any, i: number) => (
                                                    <div key={i} className="flex justify-between items-baseline text-lg text-gray-400">
                                                        <span>{addon.name}</span>
                                                        <span>${addon.cost}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex justify-end pt-2">
                                        <span className="text-lg font-medium text-[#4A4A4A]">Service Total: ${booking.totalCost}</span>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 my-8"></div>

                                {/* Payment Breakdown */}
                                <div className="space-y-3 text-center">
                                    <div className="flex flex-col items-center">
                                        <p className="text-lg text-[#3A3A3A] font-medium">10% Deposit: ${booking.depositAmount}</p>
                                        <p className="text-lg text-[#3A3A3A] font-medium">ouiimi Fee: $1.99</p>
                                        <p className="text-xl text-[#3A3A3A] font-bold mt-2">Total Today: ${booking.depositAmount}</p>
                                    </div>

                                    <div className="pt-8">
                                        <button className="text-lg text-gray-600 hover:text-gray-900 transition-colors">Pay Now</button>
                                    </div>

                                    <p className="text-[12px] text-gray-500 mt-12 pt-8">
                                        10% Deposit + $1.99 ouiimi fee paid today, 90% paid to directly Business
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Right Card: Payment Form */}
                        <div className="w-full max-w-[500px] bg-white rounded-[40px] border border-gray-200 p-8 sm:p-12 shadow-sm">
                            <div className="space-y-8">
                                {/* Customer Info Fields */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <label className="w-20 text-gray-600 text-lg">Name:</label>
                                        <Input className="flex-1 h-12 rounded-xl border-gray-200" value={user?.fname + " " + (user?.lname || "")} readOnly />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-20 text-gray-600 text-lg">Email:</label>
                                        <Input className="flex-1 h-12 rounded-xl border-gray-200" value={user?.email} readOnly />
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <label className="w-20 text-gray-600 text-lg">Number:</label>
                                        <Input className="flex-1 h-12 rounded-xl border-gray-200" value={user?.phone || ""} />
                                    </div>
                                </div>

                                <div className="border-t border-gray-100"></div>

                                {/* Stripe Form */}
                                <div className="space-y-6">
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
                                        <div className="text-center py-8">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1] mx-auto mb-3"></div>
                                            <p className="text-sm text-gray-600">Loading payment form...</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}
