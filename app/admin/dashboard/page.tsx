/**
 * Comprehensive Admin Dashboard
 * Multi-tab interface for managing businesses, payments, and services
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { LayoutDashboard, Building2, Clock, History, Landmark, CheckCircle, Info } from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { PaymentHistoryTab } from "@/components/admin/PaymentHistoryTab";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { AdminDashboardSkeleton } from "@/components/skeletons/AdminDashboardSkeleton";
import { useToast } from "@/hooks/use-toast";
import useSWR from "swr";
import { useAuth } from "@/lib/contexts/AuthContext";

// Existing booking interface
// Local interface removed in favor of imported type
import { Booking } from "@/types/booking";

// New interfaces

// New interfaces
interface Business {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  address: string;
  logo?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  owner: {
    fname: string;
    lname: string;
    email: string;
  };
  bankDetails?: {
    name?: string;
    bsb?: string;
    accountNumber?: string;
    contactNumber?: string;
  };
  category?: string;
  subCategory?: string;
  story?: string;
  createdAt: string;
}

type TabId = "overview" | "businesses" | "pending" | "history";

// Fetcher for SWR
const fetcher = (url: string, token: string) =>
  fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch");
    return res.json();
  });

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [releasingBooking, setReleasingBooking] = useState<Booking | null>(null);
  const [isReleasing, setIsReleasing] = useState(false);

  // Auth check - replaced localStorage with useAuth
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin?redirect=/admin/dashboard");
    } else if (!authLoading && user && !isAdmin) {
      console.error("Access denied: User is not an admin");
      router.replace('/?error=access_denied');
    }
  }, [user, isAdmin, authLoading, router]);

  // SWR hooks for auto-refresh data - no more token needed in headers
  const { data: statsData, error: statsError } = useSWR(
    user && isAdmin ? "/api/admin/stats/overview" : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 30000 }
  );

  const { data: businessesData, error: businessesError, mutate: mutateBusinesses } = useSWR(
    user && isAdmin ? "/api/admin/businesses" : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );

  const { data: pendingPaymentsData, error: pendingError, mutate: mutatePending } = useSWR(
    user && isAdmin ? "/api/admin/bookings/pending" : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 30000 }
  );

  const { data: paymentHistoryData, error: historyError, mutate: mutateHistory } = useSWR(
    user && isAdmin ? "/api/admin/bookings/released" : null,
    (url) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );

  const businesses = businessesData?.data?.businesses || [];
  const businessesLoading = !businessesData && !businessesError;
  const pendingPayments = pendingPaymentsData?.data?.bookings || [];
  const pendingPaymentsLoading = !pendingPaymentsData && !pendingError;
  const paymentHistory = paymentHistoryData?.data?.bookings || [];
  const paymentHistoryLoading = !paymentHistoryData && !historyError;

  const stats = useMemo(() => {
    if (!statsData?.data) {
      return {
        totalBusinesses: 0,
        pendingApproval: 0,
        pendingPayments: { count: 0, amount: 0 },
        totalRevenue: 0,
        totalFees: 0,
        netAmount: 0,
      };
    }

    const d = statsData.data;

    return {
      totalBusinesses: d.businesses?.total || 0,
      pendingApproval: d.businesses?.pending || 0,
      pendingPayments: {
        count: d.bookings?.payoutPending?.count || 0,
        amount: d.bookings?.payoutPending?.amount || 0,
      },
      totalRevenue: d.revenue?.total || 0,
      totalFees: d.revenue?.fees || 0,
      netAmount: d.revenue?.net || 0,
    };
  }, [statsData, pendingPaymentsData]);

  // Handlers
  const handleApproveBusiness = async (businessId: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        toast({
          title: "Business Approved",
          description: "The business has been approved successfully",
        });
        mutateBusinesses(); // Refresh businesses list
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to approve business",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to approve business",
      });
    }
  };

  const handleRejectBusiness = async (businessId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}/reject`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        toast({
          title: "Action Successful",
          description: "Operation completed successfully",
        });
        mutateBusinesses(); // Refresh businesses list
        mutatePending(); // Refresh pending payments
        mutateHistory(); // Refresh history
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to reject business",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject business",
      });
    }
  };

  const handleReleasePayment = async (booking: Booking) => {
    setReleasingBooking(booking);
  };

  const confirmReleasePayment = async () => {
    if (!releasingBooking) return;

    setIsReleasing(true);
    try {
      const response = await fetch(`/api/admin/bookings/${releasingBooking.id}/release-payment`, {
        method: "POST",
      });

      if (response.ok) {
        toast({
          title: "Payment Released",
          description: `Successfully released payout for booking ${releasingBooking.id.slice(-6)}`,
        });
        mutatePending();
        mutateHistory();
        setReleasingBooking(null);
      } else {
        const data = await response.json();
        toast({
          variant: "destructive",
          title: "Release Failed",
          description: data.error || "Failed to release payment",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred",
      });
    } finally {
      setIsReleasing(false);
    }
  };

  // Loading state
  if (authLoading || !user) {
    return <AdminDashboardSkeleton />;
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: <LayoutDashboard className="w-4 h-4" /> },
    {
      id: "businesses",
      label: "Businesses",
      icon: <Building2 className="w-4 h-4" />,
      count: businessesData?.data?.pagination?.total || businessesData?.data?.businesses?.length || 0
    },
    {
      id: "pending",
      label: "Pending Payments",
      icon: <Clock className="w-4 h-4" />,
      count: pendingPaymentsData?.data?.pagination?.total || pendingPaymentsData?.data?.bookings?.length || 0
    },
    {
      id: "history",
      label: "Payment History",
      icon: <History className="w-4 h-4" />,
      count: paymentHistoryData?.data?.pagination?.total || paymentHistoryData?.data?.bookings?.length || 0
    },
  ];

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen">
        {/* Header */}
        <div className="py-8 border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-[#3A3A3A] mb-2">Admin Dashboard</h1>
            <p className="text-[#888888]">Manage businesses, payments, and services</p>
          </div>
        </div>

        {/* Tabs */}
        <AdminTabs tabs={tabs} activeTab={activeTab} onTabChange={(id) => setActiveTab(id as TabId)} />

        {/* Tab Content */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === "overview" && (
            <OverviewTab
              stats={stats}
              isLoading={!statsData && !statsError}
              onViewNewBusinesses={() => setActiveTab("businesses")}
              onViewPendingPayments={() => setActiveTab("pending")}
            />
          )}

          {activeTab === "businesses" && (
            <BusinessesTab
              businesses={businesses}
              isLoading={businessesLoading}
              onApprove={handleApproveBusiness}
              onReject={handleRejectBusiness}
            />
          )}

          {activeTab === "pending" && (
            <PendingPaymentsView
              bookings={pendingPayments}
              isLoading={pendingPaymentsLoading}
              onReleasePayment={handleReleasePayment}
            />
          )}

          {activeTab === "history" && (
            <PaymentHistoryTab
              bookings={paymentHistoryData?.data?.bookings || []}
              isLoading={!paymentHistoryData && !historyError}
            />
          )}
        </div>
      </div>

      {/* Payment Release Confirmation Modal */}
      <Modal
        isOpen={!!releasingBooking}
        onClose={() => !isReleasing && setReleasingBooking(null)}
        title="Confirm Payment Release"
      >
        {releasingBooking && (
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-800">
                This action will mark the funds as released to the business. Ensure you have processed the actual payout in your bank/Stripe dashboard first.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Service Amount</span>
                <span className="font-medium text-gray-900">${releasingBooking.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Deposit Paid (10%)</span>
                <span className="font-medium text-green-600">${(releasingBooking.totalCost * 0.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Platform Fee</span>
                <span className="font-medium text-red-500">-${(releasingBooking.platformFee || 1.99).toFixed(2)}</span>
              </div>
              <div className="pt-3 border-t flex justify-between">
                <span className="font-bold text-gray-800">Net To Release</span>
                <span className="font-bold text-xl text-[#EECFD1]">
                  ${(releasingBooking.totalCost * 0.1 - (releasingBooking.platformFee || 1.99)).toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                disabled={isReleasing}
                onClick={() => setReleasingBooking(null)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 rounded-xl bg-[#3A3A3A] hover:bg-[#2a2a2a] text-white"
                disabled={isReleasing}
                onClick={confirmReleasePayment}
              >
                {isReleasing ? "Releasing..." : "Confirm Release"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
}

// Pending Payments View Component  
function PendingPaymentsView({
  bookings,
  isLoading,
  onReleasePayment,
}: {
  bookings: Booking[];
  isLoading: boolean;
  onReleasePayment: (booking: Booking) => void;
}) {
  if (isLoading) {
    return <div className="text-center py-12">Loading pending payments...</div>;
  }

  const totalDeposits = bookings.reduce((sum, b) => sum + (b.totalCost * 0.10), 0);
  const totalPlatformFees = bookings.reduce((sum, b) => sum + (b.platformFee || 1.99), 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Deposits (10%)</p>
            <p className="text-3xl font-bold text-[#3A3A3A]">${totalDeposits.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-1">{bookings.length} bookings</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Platform Fees</p>
            <p className="text-2xl font-bold text-blue-600">${totalPlatformFees.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No pending payments</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <PendingPaymentCard
              key={booking.id}
              booking={booking}
              onRelease={() => onReleasePayment(booking)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Pending Payment Card Component
function PendingPaymentCard({ booking, onRelease }: { booking: Booking; onRelease: () => void }) {
  const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
  const business = typeof booking.businessId === 'object' ? booking.businessId : null;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{service?.serviceName || 'Service'}</h3>
        <p className="text-sm text-gray-600">{business?.businessName || 'Business'}</p>
        <p className="text-xs text-gray-500">
          {new Date(booking.timeSlot.date).toLocaleDateString()} at {booking.timeSlot.startTime}
        </p>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Booking:</span>
          <span className="font-semibold">${booking.totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Deposit (10%):</span>
          <span className="font-semibold text-blue-600">${(booking.totalCost * 0.10).toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Platform Fee:</span>
          <span className="font-semibold text-green-600">${(booking.platformFee || 1.99).toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-semibold">To Release:</span>
          <span className="font-bold text-lg">${((booking.totalCost * 0.10) - (booking.platformFee || 1.99)).toFixed(2)}</span>
        </div>
      </div>

      <button
        onClick={onRelease}
        className="w-full mt-4 bg-[#3A3A3A] text-white hover:bg-[#2a2a2a] rounded-xl h-12 font-semibold transition-colors"
      >
        Release to Business
      </button>
    </div>
  );
}
