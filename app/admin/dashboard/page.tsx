/**
 * Comprehensive Admin Dashboard
 * Multi-tab interface for managing businesses, payments, and services
 */
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { LayoutDashboard, Building2, Clock, History, Landmark, CheckCircle, Info, Undo2, Ban } from "lucide-react";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { BusinessesTab } from "@/components/admin/BusinessesTab";
import { PaymentHistoryTab } from "@/components/admin/PaymentHistoryTab";
import { CancelledBookingsTab } from "@/components/admin/CancelledBookingsTab";
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

type TabId = "overview" | "businesses" | "pending" | "history" | "refunds" | "cancelled";

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
  const [markingRefundId, setMarkingRefundId] = useState<string | null>(null);

  // Auth check - replaced localStorage with useAuth
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/signin?redirect=/admin/dashboard");
    } else if (!authLoading && user && !isAdmin) {
      console.error("Access denied: User is not an admin");
      router.replace('/?error=access_denied');
    }
  }, [user, isAdmin, authLoading, router]);

  // SWR hooks - LAZY LOADED based on active tab to reduce concurrent API calls
  // Stats always load for badge counts in tab bar
  const { data: statsData, error: statsError } = useSWR(
    user && isAdmin ? "/api/admin/stats/overview" : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 } // Increased to 60s to reduce calls
  );

  // Only fetch when the corresponding tab is active
  const { data: businessesData, error: businessesError, mutate: mutateBusinesses } = useSWR(
    user && isAdmin && activeTab === "businesses" ? "/api/admin/businesses" : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );

  const { data: pendingPaymentsData, error: pendingError, mutate: mutatePending } = useSWR(
    user && isAdmin && activeTab === "pending" ? "/api/admin/bookings/pending" : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );

  const { data: paymentHistoryData, error: historyError, mutate: mutateHistory } = useSWR(
    user && isAdmin && activeTab === "history" ? "/api/admin/bookings/released" : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );

  const { data: refundsData, error: refundsError, mutate: mutateRefunds } = useSWR(
    user && isAdmin && activeTab === "refunds" ? "/api/admin/bookings/refunds" : null,
    (url: string) => fetch(url).then(res => res.json()),
    { refreshInterval: 60000 }
  );


  const businesses = businessesData?.data?.businesses || [];
  const businessesLoading = activeTab === "businesses" && !businessesData && !businessesError;
  const pendingPayments = pendingPaymentsData?.data?.bookings || [];
  const pendingPaymentsLoading = activeTab === "pending" && !pendingPaymentsData && !pendingError;
  const paymentHistory = paymentHistoryData?.data?.bookings || [];
  const paymentHistoryLoading = activeTab === "history" && !paymentHistoryData && !historyError;
  const refundsList = refundsData?.data?.bookings || [];
  const refundsLoading = activeTab === "refunds" && !refundsData && !refundsError;

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statsData]);

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

  const handleSuspendBusiness = async (businessId: string, reason: string) => {
    try {
      const response = await fetch(`/api/admin/businesses/${businessId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "suspended", notes: reason }),
      });
      if (response.ok) {
        toast({ title: "Business Suspended", description: "The business has been suspended." });
        mutateBusinesses();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to suspend business" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to suspend business" });
    }
  };

  const handleMarkRefunded = async (bookingId: string) => {
    setMarkingRefundId(bookingId);
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}/mark-refunded`, { method: "POST" });
      if (response.ok) {
        toast({ title: "Refund Marked", description: "Booking has been marked as refunded and removed from the queue." });
        mutateRefunds();
      } else {
        const data = await response.json();
        toast({ variant: "destructive", title: "Error", description: data.error || "Failed to mark refund" });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "An unexpected error occurred" });
    } finally {
      setMarkingRefundId(null);
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
      id: "refunds",
      label: "Refunds",
      icon: <Undo2 className="w-4 h-4" />,
      count: refundsData?.data?.pagination?.total || refundsData?.data?.bookings?.length || 0
    },
    {
      id: "cancelled",
      label: "Cancelled",
      icon: <Ban className="w-4 h-4" />,
      // Count could be fetched via a separate count endpoint if needed, or we just don't show a badge for now to avoid extra calls
      // For now, let's leave count undefined or 0
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
              onSuspend={handleSuspendBusiness}
            />
          )}


          {activeTab === "pending" && (
            <PendingPaymentsView
              bookings={pendingPayments}
              isLoading={pendingPaymentsLoading}
              onReleasePayment={handleReleasePayment}
            />
          )}

          {activeTab === "refunds" && (
            <RefundsView
              bookings={refundsList}
              isLoading={refundsLoading}
              onMarkRefunded={handleMarkRefunded}
              markingRefundId={markingRefundId}
            />
          )}

          {activeTab === "cancelled" && (
            <CancelledBookingsTab />
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

// Refunds View Component
function RefundsView({
  bookings,
  isLoading,
  onMarkRefunded,
  markingRefundId,
}: {
  bookings: Booking[];
  isLoading: boolean;
  onMarkRefunded: (bookingId: string) => void;
  markingRefundId: string | null;
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#EECFD1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading refund requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-orange-50 rounded-2xl p-6 border border-orange-100 mb-6">
        <h3 className="font-bold text-orange-900 text-lg mb-2">Refunds Due (50% Policy)</h3>
        <p className="text-sm text-orange-800">
          These bookings were cancelled by the shopper. Per policy, 50% of the deposit should be refunded manually via Stripe/Bank, then click &quot;Mark as Refunded&quot; to remove from this queue.
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No refunds pending</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map((booking) => (
            <RefundCard
              key={booking.id}
              booking={booking}
              onMarkRefunded={onMarkRefunded}
              isMarking={markingRefundId === booking.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RefundCard({ booking, onMarkRefunded, isMarking }: { booking: Booking; onMarkRefunded: (id: string) => void; isMarking: boolean }) {
  const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
  const shopper = typeof booking.userId === 'object' ? booking.userId : null;

  // Use stored depositAmount; fallback to 10% calculation for legacy records
  const depositPaid = booking.depositAmount || (booking.totalCost * 0.10);
  const refundAmount = depositPaid * 0.50;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg text-gray-900">Ref #{booking.bookingNumber || booking.id.slice(-6)}</h3>
            <p className="text-xs text-gray-500">Cancelled by Shopper</p>
          </div>
          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs font-bold">Refund Due</span>
        </div>

        <div className="space-y-3 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Shopper Details</p>
            <p className="font-medium text-gray-900">{shopper?.fname} {shopper?.lname}</p>
            <p className="text-sm text-gray-600">{shopper?.email}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500">Deposit Paid</p>
              <p className="font-semibold text-gray-900">${depositPaid.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">To Refund (50%)</p>
              <p className="font-bold text-lg text-red-600">${refundAmount.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="bg-yellow-50 p-3 rounded-lg text-xs text-yellow-800 border border-yellow-200">
          <strong>Action Required:</strong> Process ${refundAmount.toFixed(2)} refund manually to {shopper?.email}.
        </div>
        <button
          onClick={() => onMarkRefunded(booking.id)}
          disabled={isMarking}
          className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl h-10 text-sm font-semibold transition-colors"
        >
          {isMarking ? "Marking..." : "✓ Mark as Refunded"}
        </button>
      </div>
    </div>
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
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#EECFD1] border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-500 font-medium">Loading pending payments...</p>
        </div>
      </div>
    );
  }

  // Use real stored depositAmount, then subtract platformFee for net payout
  const totalNetPayout = bookings.reduce((sum, b) => {
    const deposit = b.depositAmount || (b.totalCost * 0.10);
    const fee = b.platformFee || 1.99;
    return sum + Math.max(0, deposit - fee);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Total Net Payouts Pending</p>
            <p className="text-3xl font-bold text-[#3A3A3A]">${totalNetPayout.toFixed(2)}</p>
            <p className="text-xs text-gray-400 mt-1">After $1.99 platform fee per booking</p>
            <p className="text-sm text-gray-500 mt-1">{bookings.length} bookings</p>
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

function PendingPaymentCard({ booking, onRelease }: { booking: Booking; onRelease: () => void }) {
  const service = typeof booking.serviceId === 'object' ? booking.serviceId : null;
  const business = typeof booking.businessId === 'object' ? booking.businessId : null;
  const totalCost = booking.totalCost || 0;
  // Use real stored depositAmount; fallback to 10% for legacy
  const depositAmount = booking.depositAmount || (totalCost * 0.10);
  const platformFee = booking.platformFee || 1.99;
  // Net payout = what business actually receives after platform fee
  const netPayout = Math.max(0, depositAmount - platformFee);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="font-semibold text-lg">{service?.serviceName || 'Service'}</h3>
        <p className="text-sm text-gray-600">{business?.businessName || 'Business'}</p>
        <p className="text-xs text-gray-500">
          {booking.timeSlot?.date
            ? (() => {
                const raw = typeof booking.timeSlot.date === 'string'
                  ? booking.timeSlot.date
                  : new Date(booking.timeSlot.date).toISOString();
                const [year, month, day] = raw.slice(0, 10).split('-').map(Number);
                const d = new Date(Date.UTC(year, month - 1, day));
                return `${d.toLocaleDateString('en-AU', { timeZone: 'UTC', day: 'numeric', month: 'numeric', year: 'numeric' })} at ${booking.timeSlot.startTime || 'N/A'}`;
              })()
            : 'Date not available'}
        </p>
        {/* Show booking status badge */}
        {booking.status && (
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full font-medium ${
            booking.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
          }`}>
            {booking.status === 'completed' ? 'Completed' : 'Upcoming'}
          </span>
        )}
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Booking:</span>
          <span className="font-semibold">${totalCost.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Deposit Collected:</span>
          <span className="font-medium text-blue-600">${depositAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Platform Fee:</span>
          <span className="font-medium text-gray-500">-${platformFee.toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t">
          <span className="font-semibold">Net Payout to Business:</span>
          <span className="font-bold text-lg text-green-600">${netPayout.toFixed(2)}</span>
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
