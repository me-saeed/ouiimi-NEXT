/**
 * Overview Tab - Admin Dashboard
 * Shows key metrics and quick actions
 */
"use client";

import { Users, DollarSign, TrendingUp, AlertCircle, Info, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewStats {
    totalBusinesses: number;
    pendingApproval: number;
    pendingPayments: {
        count: number;
        amount: number;
    };
    totalRevenue: number;
    totalFees: number;
    netAmount: number;
}

interface OverviewTabProps {
    stats: OverviewStats;
    isLoading: boolean;
    onViewNewBusinesses: () => void;
    onViewPendingPayments: () => void;
}

export function OverviewTab({
    stats,
    isLoading,
    onViewNewBusinesses,
    onViewPendingPayments,
}: OverviewTabProps) {
    if (isLoading) {
        return <div className="animate-pulse flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-[#EECFD1] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 font-medium">Crunching stats...</p>
            </div>
        </div>;
    }

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Businesses */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        {stats.pendingApproval > 0 && (
                            <span className="px-3 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-full animate-bounce">
                                {stats.pendingApproval} New
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Businesses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                </div>

                {/* Total Revenue */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue (Gross)</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.totalRevenue.toFixed(2)}</p>
                </div>

                {/* Platform Fees */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                            <DollarSign className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Platform Fees (Net)</p>
                    <p className="text-3xl font-bold text-gray-900">${stats.totalFees.toFixed(2)}</p>
                </div>

                {/* Pending Payouts */}
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                            <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                        {stats.pendingPayments.count > 0 && (
                            <span className="px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                                {stats.pendingPayments.count}
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pending Payouts</p>
                    <p className="text-3xl font-bold text-gray-900">
                        ${stats.pendingPayments.amount.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            {(stats.pendingApproval > 0 || stats.pendingPayments.count > 0) && (
                <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <Info className="w-5 h-5 text-[#EECFD1]" />
                        Needs Your Attention
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {stats.pendingApproval > 0 && (
                            <button
                                onClick={onViewNewBusinesses}
                                className="flex items-center justify-between p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-[#EECFD1]/5 hover:border-[#EECFD1]/30 transition-all text-left group"
                            >
                                <div>
                                    <p className="font-bold text-gray-800 group-hover:text-[#EECFD1] transition-colors">Review Registrations</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {stats.pendingApproval} businesses waiting for approval
                                    </p>
                                </div>
                                <AlertCircle className="w-6 h-6 text-orange-500" />
                            </button>
                        )}

                        {stats.pendingPayments.count > 0 && (
                            <button
                                onClick={onViewPendingPayments}
                                className="flex items-center justify-between p-6 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-[#EECFD1]/5 hover:border-[#EECFD1]/30 transition-all text-left group"
                            >
                                <div>
                                    <p className="font-bold text-gray-800 group-hover:text-[#EECFD1] transition-colors">Release Payments</p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        {stats.pendingPayments.count} payouts ready for disbursement
                                    </p>
                                </div>
                                <MapPin className="w-6 h-6 text-green-500" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
