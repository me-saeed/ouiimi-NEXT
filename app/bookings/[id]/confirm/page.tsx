"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function BookingConfirmPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const bookingId = params.id as string;
  const sessionId = searchParams.get("session_id");

  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [paymentVerified, setPaymentVerified] = useState(false);

  useEffect(() => {
    if (bookingId && sessionId) {
      verifyPaymentAndLoadBooking();
    }
  }, [bookingId, sessionId]);

  const verifyPaymentAndLoadBooking = async () => {
    try {
      const token = localStorage.getItem("token");

      // Verify the Stripe Checkout session
      if (sessionId) {
        const verifyResponse = await fetch("/api/payments/verify-session", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ sessionId, bookingId }),
        });

        if (!verifyResponse.ok) {
          throw new Error("Payment verification failed");
        }

        setPaymentVerified(true);
      }

      // Load booking details
      const response = await fetch(`/api/bookings/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBooking(data.booking);
      } else {
        setError("Failed to load booking details");
      }
    } catch (err: any) {
      console.error("Error:", err);
      setError(err.message || "Failed to confirm payment");
    } finally {
      setIsLoading(false);
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

  if (error || !booking) {
    return (
      <PageLayout user={user}>
        <div className="min-h-screen bg-gray-50 py-12">
          <div className="container mx-auto px-4 max-w-2xl">
            <Alert variant="destructive">
              <AlertDescription>{error || "Booking not found"}</AlertDescription>
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
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="rounded-full bg-green-100 p-4">
                <CheckCircle2 className="h-16 w-16 text-green-600" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Booking Confirmed!
            </h1>

            {paymentVerified && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-900 font-medium">
                  ✓ Payment successful
                </p>
              </div>
            )}

            <div className="border-t border-b py-6 my-6 space-y-4 text-left">
              <div>
                <p className="text-sm text-gray-600">Service</p>
                <p className="font-semibold text-gray-900">
                  {service?.serviceName || "Service"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Business</p>
                <p className="font-semibold text-gray-900">
                  {business?.businessName || "Business"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Date & Time</p>
                <p className="font-semibold text-gray-900">
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

              <div>
                <p className="text-sm text-gray-600">Booking Reference</p>
                <p className="font-mono text-sm text-gray-900">
                  {booking.id || booking._id}
                </p>
              </div>
            </div>

            <div className="text-left space-y-2 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Payment Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Deposit Paid</span>
                <span className="font-semibold text-green-600">
                  ${booking.depositAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Remaining (Pay at venue)</span>
                <span className="font-semibold text-gray-900">
                  ${booking.remainingAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full" variant="default">
                <Link href="/profile">View My Bookings</Link>
              </Button>
              <Button asChild className="w-full" variant="outline">
                <Link href="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
