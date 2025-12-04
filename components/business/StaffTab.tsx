"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { User, Edit2, Trash2, Award, CheckCircle2 } from "lucide-react";

interface StaffTabProps {
  business: any;
}

interface Staff {
  id: string;
  _id: string;
  name: string;
  photo?: string;
  bio?: string;
  about?: string; // Support both 'bio' and 'about'
  qualifications?: string;
  isActive: boolean;
}

export function StaffTab({ business }: StaffTabProps) {
  const router = useRouter();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (business?.id || business?._id) {
      loadStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business]);

  const loadStaff = async () => {
    if (!business?.id && !business?._id) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const businessId = business.id || business._id;

      const response = await fetch(`/api/staff?businessId=${businessId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff || []);
      } else {
        setError("Failed to load staff members");
      }
    } catch (e) {
      console.error("Error loading staff:", e);
      setError("Failed to load staff members");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        loadStaff();
      } else {
        setError("Failed to delete staff member");
      }
    } catch (e) {
      console.error("Error deleting staff:", e);
      setError("Failed to delete staff member");
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 px-4">
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800 font-medium">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#3A3A3A]">Staff Members</h2>
          <p className="text-[#888888] text-sm mt-1">Manage your team members</p>
        </div>
        <Link href="/business/staff/add">
          <Button className="bg-[#EECFD1] text-white hover:bg-[#e5c4c7] rounded-xl px-6 py-2.5 font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2">
            <User className="w-4 h-4" />
            Add Staff
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1] mx-auto"></div>
        </div>
      ) : staff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#F5F5F5] p-12 text-center max-w-md mx-auto shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#EECFD1]/10 flex items-center justify-center mx-auto mb-6">
            <User className="w-10 h-10 text-[#EECFD1]" />
          </div>
          <h3 className="text-xl font-bold text-[#3A3A3A] mb-2">No staff members yet</h3>
          <p className="text-[#888888] text-sm mb-6">Add your team members to get started</p>
          <Link href="/business/staff/add">
            <Button className="bg-[#EECFD1] text-white hover:bg-[#e5c4c7] rounded-xl px-6 py-3 font-semibold shadow-sm hover:shadow-md transition-all">
              Add Your First Staff Member
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all duration-300 flex flex-col group"
            >
              {/* Header with Avatar and Actions */}
              <div className="flex items-start justify-between mb-5">
                {/* Avatar with Initial */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                    <span className="text-2xl font-bold text-gray-700">
                      {member.name?.charAt(0)?.toUpperCase() || "S"}
                    </span>
                  </div>
                  {member.isActive && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(member.id);
                  }}
                  className="p-2 rounded-lg text-[#888888] hover:text-red-500 hover:bg-red-50 transition-colors"
                  aria-label="Delete staff member"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Name and Status */}
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-2">{member.name}</h3>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${member.isActive
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
                  }`}>
                  {member.isActive ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </>
                  ) : (
                    "Inactive"
                  )}
                </span>
              </div>

              {/* Qualifications */}
              {member.qualifications && (
                <div className="mb-4 flex items-start gap-2 p-3 bg-[#F5F5F5] rounded-lg">
                  <Award className="w-4 h-4 text-[#EECFD1] mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-[#3A3A3A] line-clamp-2 font-medium">{member.qualifications}</p>
                </div>
              )}

              {/* Bio/About */}
              {(member.bio || member.about) && (
                <p className="text-sm text-[#888888] line-clamp-3 mb-6 flex-1 leading-relaxed">
                  {member.bio || member.about}
                </p>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-[#F5F5F5] mt-auto">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl font-semibold border-[#EECFD1] text-[#EECFD1] hover:bg-[#EECFD1] hover:text-white transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/business/staff/${member.id}/edit`);
                  }}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
