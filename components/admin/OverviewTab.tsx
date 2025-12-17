/**
 * Overview Tab - Admin Dashboard
 * Shows key metrics and quick actions
 */
"use client";

import { Users, DollarSign, TrendingUp, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OverviewStats {
    totalBusinesses: number;
    pendingApproval: number;
    pendingPayments: {
        count: number;
        amount: number;
    };
    releasedThisMonth: number;
    platformFeesMonth: number;
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
        return <div className="animate-pulse">Loading...</div>;
    }

    return (
        <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Businesses */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl p-6 border border-blue-100">
                    <div className="flex items-center justify-between mb-4">
                        <Users className="w-8 h-8 text-blue-600" />
                        {stats.pendingApproval > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                {stats.pendingApproval} new
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Total Businesses</p>
                    <p className="text-3xl font-bold text-gray-900">{stats.totalBusinesses}</p>
                </div>

                {/* Pending Payments */}
                <div className="bg-gradient-to-br from-orange-50 to-white rounded-xl p-6 border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                        {stats.pendingPayments.count > 0 && (
                            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full">
                                {stats.pendingPayments.count}
                            </span>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Pending Payments</p>
                    <p className="text-3xl font-bold text-gray-900">
                        ${stats.pendingPayments.amount.toFixed(2)}
                    </p>
                </div>

                {/* Released This Month */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl p-6 border border-green-100">
                    <div className="flex items-center justify-between mb-4">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Released (MTD)</p>
                    <p className="text-3xl font-bold text-gray-900">
                        ${stats.releasedThisMonth.toFixed(2)}
                    </p>
                </div>

                {/* Platform Fees */}
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl p-6 border border-purple-100">
                    <div className="flex items-center justify-between mb-4">
                        <DollarSign className="w-8 h-8 text-purple-600" />
                    </div>
                    <p className="text-sm text-gray-600 mb-1">Platform Fees (MTD)</p>
                    <p className="text-3xl font-bold text-gray-900">
                        ${stats.platformFeesMonth.toFixed(2)}
                    </p>
                </div>
            </div>

            {/* Quick Actions */}
            {(stats.pendingApproval > 0 || stats.pendingPayments.count > 0) && (
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {stats.pendingApproval > 0 && (
                            <Button
                                onClick={onViewNewBusinesses}
                                variant="outline"
                                className="h-auto py-4 px-6 flex items-center justify-between"
                            >
                                <div className="text-left">
                                    <p className="font-semibold">Review New Businesses</p>
                                    <p className="text-sm text-gray-500">
                                        {stats.pendingApproval} waiting for approval
                                    </p>
                                </div>
                                <AlertCircle className="w-5 h-5 text-orange-600" />
                            </Button>
                        )}

                        {stats.pendingPayments.count > 0 && (
                            <Button
                                onClick={onViewPendingPayments}
                                variant="outline"
                                className="h-auto py-4 px-6 flex items-center justify-between"
                            >
                                <div className="text-left">
                                    <p className="font-semibold">Release Pending Payments</p>
                                    <p className="text-sm text-gray-500">
                                        {stats.pendingPayments.count} payments waiting
                                    </p>
                                </div>
                                <DollarSign className="w-5 h-5 text-green-600" />
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
