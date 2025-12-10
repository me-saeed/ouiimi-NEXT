"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, StripeElementsOptions } from "@stripe/stripe-js";

// Get Stripe publishable key
const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

// Initialize Stripe with publishable key if available
const stripePromise = stripeKey ? loadStripe(stripeKey) : null;

interface StripeProviderProps {
    children: React.ReactNode;
    clientSecret: string;
    amount?: number;
}

export default function StripeProvider({
    children,
    clientSecret,
    amount,
}: StripeProviderProps) {
    // Check if Stripe key is configured
    if (!stripeKey || !stripePromise) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-red-800 font-bold mb-2">Stripe Configuration Error</h3>
                <p className="text-red-700 mb-4">
                    Stripe publishable key is not configured. Please add the following to your `.env.local` file:
                </p>
                <code className="block bg-red-100 p-3 rounded text-sm text-red-900">
                    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
                </code>
                <p className="text-red-600 text-sm mt-3">
                    Get your API keys from:{" "}
                    <a
                        href="https://dashboard.stripe.com/test/apikeys"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline"
                    >
                        Stripe Dashboard
                    </a>
                </p>
            </div>
        );
    }

    const options: StripeElementsOptions = {
        clientSecret,
        appearance: {
            theme: "stripe",
            variables: {
                colorPrimary: "#EECFD1",
                colorBackground: "#ffffff",
                colorText: "#3A3A3A",
                colorDanger: "#ef4444",
                fontFamily: "system-ui, sans-serif",
                spacingUnit: "4px",
                borderRadius: "8px",
            },
        },
    };

    return (
        <Elements stripe={stripePromise} options={options}>
            {children}
        </Elements>
    );
}
