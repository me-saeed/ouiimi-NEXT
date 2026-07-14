/**
 * Businesses Tab - Admin Dashboard
 * Manage all businesses: view, approve, reject, suspend
 */
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Mail, Phone, MapPin, CheckCircle, XCircle, Eye, Info, Landmark } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";

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
    category?: string;
    subCategory?: string;
    story?: string;
    createdAt: string;
}

interface BusinessesTabProps {
    businesses: Business[];
    isLoading: boolean;
    onApprove: (businessId: string) => Promise<void>;
    onReject: (businessId: string, reason: string) => Promise<void>;
}

export function BusinessesTab({
    businesses,
    isLoading,
    onApprove,
    onReject,
}: BusinessesTabProps) {
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected" | "suspended">("all");
    const [searchQuery, setSearchQuery] = useState("");

    // UI Modals State
    const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
    const [rejectingBusinessId, setRejectingBusinessId] = useState<string | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [approvingBusinessId, setApprovingBusinessId] = useState<string | null>(null);

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

    const handleConfirmReject = async () => {
        if (!rejectingBusinessId || rejectionReason.length < 10) return;
        await onReject(rejectingBusinessId, rejectionReason);
        setRejectingBusinessId(null);
        setRejectionReason("");
    };

    const handleConfirmApprove = async () => {
        if (!approvingBusinessId) return;
        await onApprove(approvingBusinessId);
        setApprovingBusinessId(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#EECFD1] border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-500 font-medium">Loading businesses...</p>
                </div>
            </div>
        );
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
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search businesses or owners..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EECFD1] shadow-sm transition-all"
                />
            </div>

            {/* Business List */}
            {filteredBusinesses.length === 0 ? (
                <div className="text-center py-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                    No businesses found
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                    {filteredBusinesses.map((business) => (
                        <div
                            key={business.id}
                            className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="relative">
                                            {business.logo ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img
                                                    src={business.logo}
                                                    alt={business.businessName}
                                                    className="w-16 h-16 rounded-2xl object-cover border border-gray-100 bg-white"
                                                />
                                            ) : (
                                                <div className="w-16 h-16 rounded-2xl bg-[#EECFD1]/10 flex items-center justify-center border border-[#EECFD1]/20">
                                                    <Building2 className="w-8 h-8 text-[#EECFD1]" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-xl text-gray-800 group-hover:text-[#EECFD1] transition-colors">
                                                {business.businessName}
                                            </h3>
                                            <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                                <span className="font-medium text-gray-700">Owner:</span>
                                                {business.owner?.fname || 'N/A'} {business.owner?.lname || ''}
                                            </div>
                                            <div className="mt-2 text-xs font-semibold uppercase tracking-wider">
                                                <span className={`px-2 py-1 rounded-md ${getStatusBadge(business.status)}`}>
                                                    {business.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-gray-400" />
                                            {business.email}
                                        </div>
                                        {business.phone && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400" />
                                                {business.phone}
                                            </div>
                                        )}
                                        <div className="flex items-start gap-2 max-w-[300px]">
                                            <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <span className="line-clamp-2">{business.address}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setSelectedBusiness(business)}
                                        className="rounded-xl border-gray-200 hover:border-[#EECFD1] hover:bg-[#EECFD1]/5"
                                    >
                                        <Eye className="w-4 h-4 mr-1.5" />
                                        Details
                                    </Button>

                                    {business.status === "pending" && (
                                        <>
                                            <Button
                                                size="sm"
                                                onClick={() => setApprovingBusinessId(business.id)}
                                                className="rounded-xl bg-green-500 hover:bg-green-600 text-white border-none shadow-sm"
                                            >
                                                <CheckCircle className="w-4 h-4 mr-1.5" />
                                                Approve
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                className="rounded-xl shadow-sm"
                                                onClick={() => setRejectingBusinessId(business.id)}
                                            >
                                                <XCircle className="w-4 h-4 mr-1.5" />
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

            {/* Details Modal */}
            <Modal
                isOpen={!!selectedBusiness}
                onClose={() => setSelectedBusiness(null)}
                title="Business Registration Details"
                maxWidth="max-w-2xl"
            >
                {selectedBusiness && (
                    <div className="space-y-8 p-2">
                        {/* Header Info */}
                        <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                            {selectedBusiness.logo ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={selectedBusiness.logo} alt={selectedBusiness.businessName} className="w-24 h-24 rounded-2xl object-cover" />
                            ) : (
                                <div className="w-24 h-24 rounded-2xl bg-gray-50 flex items-center justify-center">
                                    <Building2 className="w-12 h-12 text-gray-300" />
                                </div>
                            )}
                            <div>
                                <h4 className="text-2xl font-bold text-gray-800">{selectedBusiness.businessName}</h4>
                                <p className="text-gray-500">{selectedBusiness.category} • {selectedBusiness.subCategory}</p>
                                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusBadge(selectedBusiness.status)}`}>
                                    {selectedBusiness.status}
                                </span>
                            </div>
                        </div>

                        {/* Owner & Contact */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h5 className="font-bold text-sm uppercase text-gray-400 flex items-center gap-2">
                                    <Info className="w-4 h-4" /> Owner Info
                                </h5>
                                <div className="bg-gray-50 p-4 rounded-xl space-y-2">
                                    <p className="text-gray-800 font-medium">{selectedBusiness.owner?.fname} {selectedBusiness.owner?.lname}</p>
                                    <p className="text-sm text-gray-600">{selectedBusiness.owner?.email}</p>
                                    {selectedBusiness.phone && <p className="text-sm text-gray-600">{selectedBusiness.phone}</p>}
                                </div>
                            </div>
                            <div className="space-y-4">
                                <h5 className="font-bold text-sm uppercase text-gray-400 flex items-center gap-2">
                                    <MapPin className="w-4 h-4" /> Location
                                </h5>
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <p className="text-sm text-gray-700 leading-relaxed">{selectedBusiness.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Bank Details */}
                        <div className="space-y-4">
                            <h5 className="font-bold text-sm uppercase text-gray-400 flex items-center gap-2">
                                <Landmark className="w-4 h-4" /> Settlement Account
                            </h5>
                            {selectedBusiness.bankDetails?.accountNumber ? (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-blue-500 font-bold uppercase">Account Name</p>
                                        <p className="text-sm font-medium text-blue-900">{selectedBusiness.bankDetails.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-blue-500 font-bold uppercase">BSB</p>
                                        <p className="text-sm font-medium text-blue-900">{selectedBusiness.bankDetails.bsb}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-xs text-blue-500 font-bold uppercase">Account Number</p>
                                        <p className="text-sm font-medium text-blue-900 font-mono tracking-wider">{selectedBusiness.bankDetails.accountNumber}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-amber-700 text-sm flex items-center gap-3">
                                    <XCircle className="w-5 h-5 flex-shrink-0" />
                                    Bank details not yet configured.
                                </div>
                            )}
                        </div>

                        {/* Story / About */}
                        <div className="space-y-4">
                            <h5 className="font-bold text-sm uppercase text-gray-400">About the Business</h5>
                            <div className="bg-gray-50 p-6 rounded-2xl">
                                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-line italic">
                                    &ldquo;{selectedBusiness.story || "No story provided by business."}&rdquo;
                                </p>
                            </div>
                        </div>

                        {/* Actions in Modal */}
                        {selectedBusiness.status === "pending" && (
                            <div className="pt-6 flex gap-3 border-t border-gray-100">
                                <Button
                                    className="flex-1 bg-green-500 hover:bg-green-600"
                                    onClick={() => {
                                        setApprovingBusinessId(selectedBusiness.id);
                                        setSelectedBusiness(null);
                                    }}
                                >
                                    Approve Registration
                                </Button>
                                <Button
                                    variant="destructive"
                                    className="flex-1"
                                    onClick={() => {
                                        setRejectingBusinessId(selectedBusiness.id);
                                        setSelectedBusiness(null);
                                    }}
                                >
                                    Reject
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Rejection Modal */}
            <Modal
                isOpen={!!rejectingBusinessId}
                onClose={() => setRejectingBusinessId(null)}
                title="Reject Registration"
            >
                <div className="space-y-6">
                    <p className="text-gray-600 text-sm">
                        Please provide a reason for rejecting this registration. This will be visible to the business owner.
                    </p>
                    <textarea
                        className="w-full h-32 p-4 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                        placeholder="Reason (minimum 10 characters)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                    />
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setRejectingBusinessId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            className="flex-1 rounded-xl"
                            disabled={rejectionReason.length < 10}
                            onClick={handleConfirmReject}
                        >
                            Reject Business
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Approve Confirmation Modal */}
            <Modal
                isOpen={!!approvingBusinessId}
                onClose={() => setApprovingBusinessId(null)}
                title="Approve Business"
            >
                <div className="space-y-6">
                    <p className="text-gray-600">
                        Are you sure you want to approve this business? They will be able to start listing services and taking bookings immediately.
                    </p>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            className="flex-1 rounded-xl"
                            onClick={() => setApprovingBusinessId(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 rounded-xl bg-green-500 hover:bg-green-600"
                            onClick={handleConfirmApprove}
                        >
                            Confirm Approval
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
