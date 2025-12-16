"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Building2,
    Search,
    Filter,
    CheckCircle2,
    XCircle,
    Ban,
    Eye,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

interface Business {
    id: string;
    businessName: string;
    email: string;
    phone: string;
    category: string;
    status: "approved" | "pending" | "suspended";
    address: string;
    logo?: string;
    createdAt: string;
}

interface Statistics {
    total: number;
    approved: number;
    pending: number;
    suspended: number;
}

export default function AdminBusinessesPage() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [businesses, setBusinesses] = useState<Business[]>([]);
    const [statistics, setStatistics] = useState<Statistics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    // Filters
    const [statusFilter, setStatusFilter] = useState("all");
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");
        if (token && userData) {
            try {
                const parsedUser = JSON.parse(userData);
                setUser(parsedUser);
                loadBusinesses();
            } catch (e) {
                console.error("Error parsing user data:", e);
                router.push("/signin");
            }
        } else {
            router.push("/signin");
        }
    }, [router, statusFilter, search, currentPage]);

    const loadBusinesses = async () => {
        setIsLoading(true);
        setError("");
        try {
            const token = localStorage.getItem("token");
            const params = new URLSearchParams({
                status: statusFilter,
                page: currentPage.toString(),
                limit: "20",
            });
            if (search) {
                params.append("search", search);
            }

            const response = await fetch(`/api/admin/businesses?${params}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setBusinesses(data.businesses || []);
                setStatistics(data.statistics);
                setTotalPages(data.pagination.totalPages);
            } else {
                setError("Failed to load businesses");
            }
        } catch (e) {
            console.error("Error loading businesses:", e);
            setError("Failed to load businesses");
        } finally {
            setIsLoading(false);
        }
    };

    const handleUpdateStatus = async (businessId: string, newStatus: "approved" | "suspended") => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`/api/admin/businesses/${businessId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: newStatus }),
            });

            if (response.ok) {
                setSuccess(`Business ${newStatus} successfully`);
                loadBusinesses();
                setTimeout(() => setSuccess(""), 3000);
            } else {
                const data = await response.json();
                setError(data.error || "Failed to update business");
            }
        } catch (e) {
            console.error("Error updating business:", e);
            setError("Failed to update business");
        }
    };

    if (!user) {
        return (
            <PageLayout user={null}>
                <div className="bg-white min-h-screen py-12">
                    <div className="container mx-auto px-4">
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#EECFD1]"></div>
                        </div>
                    </div>
                </div>
            </PageLayout>
        );
    }

    return (
        <PageLayout user={user}>
            <div className="bg-white min-h-screen py-12">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-[#3A3A3A] mb-2">Business Management</h1>
                        <p className="text-[#888888]">Manage and approve businesses on the platform</p>
                    </div>

                    {/* Alerts */}
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

                    {/* Statistics Cards */}
                    {statistics && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-blue-600 mb-1">Total Businesses</p>
                                        <p className="text-3xl font-bold text-blue-900">{statistics.total}</p>
                                    </div>
                                    <Building2 className="w-10 h-10 text-blue-400" />
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-green-600 mb-1">Approved</p>
                                        <p className="text-3xl font-bold text-green-900">{statistics.approved}</p>
                                    </div>
                                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-yellow-600 mb-1">Pending</p>
                                        <p className="text-3xl font-bold text-yellow-900">{statistics.pending}</p>
                                    </div>
                                    <Filter className="w-10 h-10 text-yellow-400" />
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-red-600 mb-1">Suspended</p>
                                        <p className="text-3xl font-bold text-red-900">{statistics.suspended}</p>
                                    </div>
                                    <Ban className="w-10 h-10 text-red-400" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filters */}
                    <div className="bg-gray-50 rounded-xl p-6 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                <input
                                    type="text"
                                    placeholder="Search by business name or email..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setCurrentPage(1);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => {
                                    setStatusFilter(e.target.value);
                                    setCurrentPage(1);
                                }}
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent"
                            >
                                <option value="all">All Statuses</option>
                                <option value="approved">Approved</option>
                                <option value="pending">Pending</option>
                                <option value="suspended">Suspended</option>
                            </select>
                        </div>
                    </div>

                    {/* Businesses Table */}
                    {isLoading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                        </div>
                    ) : businesses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No businesses found</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Business
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Contact
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Joined
                                                </th>
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {businesses.map((business) => (
                                                <tr key={business.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            {business.logo && (
                                                                <img
                                                                    src={business.logo}
                                                                    alt={business.businessName}
                                                                    className="w-10 h-10 rounded-full mr-3 object-cover"
                                                                />
                                                            )}
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{business.businessName}</p>
                                                                <p className="text-sm text-gray-500">{business.address}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <p className="text-sm text-gray-900">{business.email}</p>
                                                        <p className="text-sm text-gray-500">{business.phone}</p>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                                            {business.category}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`px-3 py-1 text-xs font-semibold rounded-full ${business.status === "approved"
                                                                    ? "bg-green-100 text-green-800"
                                                                    : business.status === "pending"
                                                                        ? "bg-yellow-100 text-yellow-800"
                                                                        : "bg-red-100 text-red-800"
                                                                }`}
                                                        >
                                                            {business.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        {new Date(business.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => router.push(`/business/${business.id}`)}
                                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="View Business"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                            {business.status === "pending" && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(business.id, "approved")}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Approve"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {business.status === "approved" && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(business.id, "suspended")}
                                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Suspend"
                                                                >
                                                                    <Ban className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            {business.status === "suspended" && (
                                                                <button
                                                                    onClick={() => handleUpdateStatus(business.id, "approved")}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="Reactivate"
                                                                >
                                                                    <CheckCircle2 className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-6">
                                    <p className="text-sm text-gray-600">
                                        Page {currentPage} of {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            <ChevronLeft className="w-4 h-4" />
                                            Previous
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            Next
                                            <ChevronRight className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </PageLayout>
    );
}
