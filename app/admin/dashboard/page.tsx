"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ServiceCard } from "@/components/ui/service-card";
import { Calendar, DollarSign, CheckCircle2 } from "lucide-react";

interface Booking {
  id: string;
  userId: any;
  serviceId: any;
  businessId: any;
  timeSlot: {
    date: string;
    startTime: string;
    endTime: string;
  };
  totalCost: number;
  platformFee?: number;
  serviceAmount?: number;
  adminPaymentStatus?: string;
  status: string;
  paymentStatus: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pendingBookings, setPendingBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadPendingBookings();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadPendingBookings = async () => {
    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/admin/bookings/pending", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingBookings(data.bookings || []);
      } else {
        setError("Failed to load pending bookings");
      }
    } catch (e) {
      console.error("Error loading pending bookings:", e);
      setError("Failed to load pending bookings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReleasePayment = async (bookingId: string) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/admin/bookings/${bookingId}/release-payment`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSuccess("Payment released successfully");
        loadPendingBookings();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to release payment");
      }
    } catch (e) {
      console.error("Error releasing payment:", e);
      setError("Failed to release payment");
    }
  };

  const formatBookingForServiceCard = (booking: Booking) => {
    const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
    const businessData = typeof booking.businessId === 'object' ? booking.businessId : null;

    return {
      id: booking.id,
      name: service?.serviceName || 'Service',
      price: booking.serviceAmount || booking.totalCost,
      image: businessData?.logo || "/placeholder-logo.png",
      category: service?.category || '',
      businessName: businessData?.businessName || 'Business',
      location: businessData?.address || '',
      duration: service?.duration ? `${service.duration}mins` : undefined,
      date: new Date(booking.timeSlot.date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }),
      time: `${booking.timeSlot.startTime} - ${booking.timeSlot.endTime}`,
    };
  };

  if (!user) {
    return (
      <PageLayout user={null}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalDeposits = pendingBookings.reduce((sum, b) => sum + (b.totalCost * 0.10), 0);
  const totalPlatformFees = pendingBookings.reduce((sum, b) => sum + (b.platformFee || 1.99), 0);
  const totalRemaining = pendingBookings.reduce((sum, b) => sum + (b.totalCost * 0.90), 0);

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#3A3A3A] mb-2">Admin Dashboard</h1>
            <p className="text-[#888888]">Manage payments and bookings</p>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 mb-8 shadow-sm border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-gray-500 mb-1">Total Deposits (10%)</p>
                <p className="text-3xl font-bold text-[#3A3A3A]">${totalDeposits.toFixed(2)}</p>
                <p className="text-sm text-gray-500 mt-1">{pendingBookings.length} bookings</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Platform Fees</p>
                <p className="text-2xl font-bold text-blue-600">${totalPlatformFees.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">$1.99 per booking</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Remaining (90%)</p>
                <p className="text-2xl font-bold text-orange-600">${totalRemaining.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Paid at venue</p>
              </div>
            </div>
          </div>

          {/* Pending Bookings */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-[#3A3A3A]">Pending Payments</h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : pendingBookings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No pending payments</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {pendingBookings.map((booking) => {
                  const cardData = formatBookingForServiceCard(booking);
                  return (
                    <div key={booking.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                      <div className="mb-4">
                        <ServiceCard {...cardData} />
                      </div>

                      <div className="space-y-3 pt-4 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Total Booking:</span>
                          <span className="font-semibold">${booking.totalCost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Deposit (10%):</span>
                          <span className="font-semibold text-blue-600">${(booking.totalCost * 0.10).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-500">Platform Fee:</span>
                          <span className="font-semibold text-green-600">${(booking.platformFee || 1.99).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-sm font-semibold">To Release to Business:</span>
                          <span className="font-bold text-lg text-[#3A3A3A]">${((booking.totalCost * 0.10) - (booking.platformFee || 1.99)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                          <span>Remaining (90%):</span>
                          <span className="text-orange-600 font-medium">${(booking.totalCost * 0.90).toFixed(2)} (Paid at venue)</span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleReleasePayment(booking.id)}
                        className="w-full mt-4 bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] rounded-xl h-12 font-semibold"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Release Deposit to Business
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
