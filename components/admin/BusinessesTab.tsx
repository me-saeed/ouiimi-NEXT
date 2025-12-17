/**
 * Businesses Tab - Admin Dashboard
 * Manage all businesses: view, approve, reject, suspend
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Eye } from "lucide-react";

interface Business {
    id: string;
    businessName: string;
    email: string;
    phone?: string;
    address: string;
    logo?: string;
    status: "pending" | "approved" | "rejected" | "suspended";
    owner?: {
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
    createdAt: string;
}

interface BusinessesTabProps {
    businesses: Business[];
    isLoading: boolean;
    onApprove: (businessId: string) => Promise<void>;
    onReject: (businessId: string, reason: string) => Promise<void>;
    onViewDetails: (business: Business) => void;
}

export function BusinessesTab({
    businesses,
    isLoading,
    onApprove,
    onReject,
    onViewDetails,
}: BusinessesTabProps) {
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Filter and search
    const filteredBusinesses = businesses.filter((b) => {
        const matchesFilter = filter === "all" || b.status === filter;
        const ownerName = b.owner ? `${b.owner.fname} ${b.owner.lname}` : '';
        const matchesSearch =
            !searchQuery ||
            b.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ownerName.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const counts = {
        all: businesses.length,
        pending: businesses.filter((b) => b.status === "pending").length,
        approved: businesses.filter((b) => b.status === "approved").length,
        rejected: businesses.filter((b) => b.status === "rejected").length,
        suspended: businesses.filter((b) => b.status === "suspended").length,
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            pending: "bg-orange-100 text-orange-700",
            approved: "bg-green-100 text-green-700",
            rejected: "bg-red-100 text-red-700",
            suspended: "bg-gray-100 text-gray-700",
        };
        return styles[status] || styles.pending;
    };

    if (isLoading) {
        return <div className="text-center py-12">Loading businesses...</div>;
    }

    return (
        <div className="space-y-6">
            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {(["all", "pending", "approved", "rejected", "suspended"] as const).map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-colors ${filter === f
                            ? "bg-[#EECFD1] text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                        <span className="ml-2 px-2 py-0.5 rounded-full bg-white/20 text-xs">
                            {counts[f]}
                        </span>
                    </button>
                ))}
            </div>

            {/* Search */}
            <input
                type="text"
                placeholder="Search businesses or owners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EECFD1]"
            />

            {/* Business List */}
            {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    No businesses found
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredBusinesses.map((business) => (
                        <div
                            key={business.id}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-3">
                                        {business.logo ? (
                                            <img
                                                src={business.logo}
                                                alt={business.businessName}
                                                className="w-12 h-12 rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Building2 className="w-6 h-6 text-gray-400" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-lg text-gray-900">
                                                {business.businessName}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Owner: {business.owner?.fname || 'N/A'} {business.owner?.lname || ''}
                                            </p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(business.status)}`}>
                                            {business.status}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4" />
                                            {business.email}
                                        </div>
                                        {business.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4" />
                                                {business.phone}
                                            </div>
                                        )}
                                        <div className="flex items-center gap-2 md:col-span-2">
                                            <MapPin className="w-4 h-4" />
                                            {business.address}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => onViewDetails(business)}
                                    >
                                        <Eye className="w-4 h-4 mr-1" />
                                        Details
                                    </Button>

                                    {business.status === "pending" && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => onApprove(business.id)}
                                                className="bg-green-600 hover:bg-green-700 text-white"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => {
                                                    const reason = prompt("Rejection reason (minimum 10 characters):");
                                                    if (reason && reason.length >= 10) {
                                                        onReject(business.id, reason);
                                                    } else if (reason) {
                                                        alert("Reason must be at least 10 characters");
                                                    }
                                                }}
                                            >
                                                <XCircle className="w-4 h-4 mr-1" />
                                                Reject
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
