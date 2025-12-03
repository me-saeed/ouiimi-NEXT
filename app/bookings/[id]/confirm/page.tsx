"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

function BookingConfirmationContent() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [booking, setBooking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    
    if (!token || !userData) {
      router.push("/signin");
      return;
    }

    try {
      setUser(JSON.parse(userData));
      loadBooking();
    } catch (e) {
      console.error("Error parsing user data:", e);
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, bookingId]);

  const loadBooking = async () => {
    setIsLoading(true);
    setError("");
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
      } else {
        setError("Booking not found");
      }
    } catch (e) {
      console.error("Error loading booking:", e);
      setError("Failed to load booking");
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (!user || isLoading) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    );
  }

  if (error || !booking) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">Booking Not Found</h1>
              <p className="text-[#3A3A3A]/70 mb-8">{error || "The booking you're looking for doesn't exist."}</p>
              <Button onClick={() => router.push("/profile")} className="btn-polished-primary">
                Go to Profile
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-[#3A3A3A] mb-2">Booking Confirmed!</h1>
              <p className="text-[#3A3A3A]/70">Your booking has been successfully created.</p>
            </div>

            <div className="card-polished p-6 space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Booking Details</h2>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking ID:</span>
                    <span className="font-medium">{booking.id?.slice(-8) || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Business:</span>
                    <span className="font-medium">
                      {typeof booking.businessId === 'object' 
                        ? booking.businessId.businessName 
                        : "Business"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-medium">
                      {typeof booking.serviceId === 'object' 
                        ? booking.serviceId.serviceName 
                        : "Service"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{formatDate(booking.timeSlot.date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Time:</span>
                    <span className="font-medium">
                      {booking.timeSlot.startTime} - {booking.timeSlot.endTime}
                    </span>
                  </div>
                  {booking.staffId && typeof booking.staffId === 'object' && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Staff:</span>
                      <span className="font-medium">{booking.staffId.name}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-3">Payment Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Cost:</span>
                    <span className="font-semibold">${booking.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-green-600">
                    <span>Deposit Paid (10%):</span>
                    <span>${booking.depositAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining (90%):</span>
                    <span>${booking.remainingAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {booking.customerNotes && (
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-muted-foreground">{booking.customerNotes}</p>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={() => router.push("/profile")}
                  className="flex-1 btn-polished-primary"
                >
                  View My Bookings
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="flex-1"
                >
                  Browse More Services
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

export default function BookingConfirmationPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="bg-white min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
        </div>
      </PageLayout>
    }>
      <BookingConfirmationContent />
    </Suspense>
  );
}

