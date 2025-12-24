"use client";

import { FormEvent, useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

interface CheckoutFormProps {
    bookingId: string;
    amount: number;
    onSuccess?: () => void;
    layoutType?: "default" | "compact";
}

export default function CheckoutForm({
    bookingId,
    amount,
    onSuccess,
    layoutType = "default",
}: CheckoutFormProps) {
    const stripe = useStripe();
    const elements = useElements();

    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);
        setErrorMessage("");

        try {
            // Confirm payment with Stripe
            const { error, paymentIntent } = await stripe.confirmPayment({
                elements,
                redirect: "if_required",
            });

            if (error) {
                setErrorMessage(error.message || "Payment failed");
                setIsProcessing(false);
                return;
            }

            if (paymentIntent && paymentIntent.status === "succeeded") {
                // Update booking status on backend (payment already confirmed by Stripe)
                const response = await fetch("/api/payments/confirm", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                        bookingId: bookingId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "Failed to update booking status");
                }

                // Payment successful
                if (onSuccess) {
                    onSuccess();
                } else {
                    // Redirect to confirmation page
                    window.location.href = `/bookings/${bookingId}/confirm`;
                }
            }
        } catch (err: any) {
            console.error("Payment error:", err);
            setErrorMessage(err.message || "An unexpected error occurred");
            setIsProcessing(false);
        }
    };

    if (layoutType === "compact") {
        return (
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <label className="w-32 text-gray-500 text-lg">Name On Card:</label>
                        <div className="flex-1 border border-gray-200 rounded-xl h-12 px-4 flex items-center">
                            {/* Simple text input for name on card if needed, or Stripe handles it in PaymentElement */}
                            <Input className="border-none shadow-none focus-visible:ring-0 p-0 h-full" placeholder="Full Name" />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <PaymentElement options={{
                            layout: 'tabs',
                        }} />
                    </div>
                </div>

                {errorMessage && (
                    <Alert className="border-red-200 bg-red-50">
                        <AlertDescription className="text-red-800 font-medium">
                            {errorMessage}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="pt-4">
                    <Button
                        type="submit"
                        disabled={!stripe || isProcessing}
                        className="w-full h-12 text-lg font-bold bg-white text-gray-800 border-none shadow-none hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                        {isProcessing ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-800" />
                        ) : (
                            `STRIPE PAY $${amount.toFixed(2)}`
                        )}
                    </Button>
                </div>
            </form>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <PaymentElement />

            {errorMessage && (
                <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 font-medium">
                        {errorMessage}
                    </AlertDescription>
                </Alert>
            )}

            <Button
                type="submit"
                disabled={!stripe || isProcessing}
                variant="pink"
                className="w-full h-12 text-base font-semibold"
            >
                {isProcessing ? (
                    <div className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                        Processing...
                    </div>
                ) : (
                    `Pay $${amount.toFixed(2)}`
                )}
            </Button>

            <p className="text-xs text-center text-gray-500">
                Your payment is secured by Stripe. We do not store your card details.
            </p>
        </form>
    );
}
