"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";
import { User } from "lucide-react";

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
        <div className="space-y-2">
          {staff.map((member) => (
            <div
              key={member.id}
              onClick={() => router.push(`/business/staff/${member.id}`)}
              className="flex items-center gap-4 p-4 bg-white rounded-lg hover:bg-gray-50 transition-all cursor-pointer"
            >
              {/* Avatar */}
              <div className="w-12 h-12 rounded-full bg-[#EECFD1] flex items-center justify-center flex-shrink-0">
                {member.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={member.photo}
                    alt={member.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-lg font-bold text-[#3A3A3A]">
                      {member.name?.charAt(0)?.toUpperCase() || "S"}
                    </span>
                )}
              </div>

              {/* Name */}
              <div className="flex-1">
                <h3 className="text-base font-semibold text-[#3A3A3A]">{member.name}</h3>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
