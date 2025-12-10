"use client";

import { FormEvent, useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CheckoutFormProps {
    bookingId: string;
    amount: number;
    onSuccess?: () => void;
}

export default function CheckoutForm({
    bookingId,
    amount,
    onSuccess,
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
                // Confirm payment on backend
                const response = await fetch("/api/payments/confirm", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        paymentIntentId: paymentIntent.id,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to confirm payment on server");
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
