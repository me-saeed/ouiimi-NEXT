"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { User, Plus, Award, CheckCircle2, Edit2, Trash2 } from "lucide-react";

export default function BusinessStaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [staff, setStaff] = useState<any[]>([]);
  const [businessId, setBusinessId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadBusinessAndStaff();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const loadBusinessAndStaff = async () => {
    try {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        router.push("/signin");
        return;
      }

      const parsedUser = JSON.parse(userData);
      const userId = parsedUser.id || parsedUser._id;

      if (!userId) {
        console.error("User ID not found");
        setIsLoading(false);
        return;
      }

      // First, find the business for this user
      const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!businessResponse.ok) {
        console.error("Failed to fetch business:", businessResponse.status);
        setIsLoading(false);
        return;
      }

      const businessData = await businessResponse.json();
      if (businessData.businesses && businessData.businesses.length > 0) {
        const foundBusiness = businessData.businesses[0];
        const foundBusinessId = foundBusiness.id || foundBusiness._id;
        setBusinessId(foundBusinessId);

        // Now load staff for this business
        const staffResponse = await fetch(`/api/staff?businessId=${foundBusinessId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (staffResponse.ok) {
          const staffData = await staffResponse.json();
          if (staffData.staff) {
            setStaff(staffData.staff);
          }
        } else {
          console.error("Failed to fetch staff:", staffResponse.status);
        }
      } else {
        // No business found - this is okay, staff list will be empty
        console.log("No business found for user");
      }
    } catch (error: any) {
      console.error("Error loading business and staff:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (!confirm("Are you sure you want to remove this staff member? They will be deactivated.")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Please sign in to manage staff");
        router.push("/signin");
        return;
      }

      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        // Reload staff after deletion
        console.log("Staff deleted successfully, reloading...");
        await loadBusinessAndStaff();
      } else {
        const errorData = await response.json();
        console.error("Failed to delete staff:", errorData);
        alert(errorData.error || "Failed to remove staff member");
      }
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      alert(error.message || "Failed to remove staff member. Please try again.");
    }
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

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[#3A3A3A] mb-2">Staff Members</h1>
              <p className="text-[#888888]">Manage your team members</p>
            </div>
            <Link
              href="/business/staff/add"
              className="bg-[#EECFD1] text-white px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-[#e5c4c7] transition-all whitespace-nowrap flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Staff
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#F5F5F5] p-16 text-center max-w-2xl mx-auto shadow-sm">
              <div className="w-20 h-20 rounded-full bg-[#EECFD1]/10 flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-[#EECFD1]" />
              </div>
              <h2 className="text-2xl font-bold text-[#3A3A3A] mb-3">No staff members yet</h2>
              <p className="text-[#888888] mb-8 text-lg">Add your team members to get started</p>
              <Link
                href="/business/staff/add"
                className="inline-block bg-[#EECFD1] text-white px-8 py-3.5 rounded-xl font-semibold shadow-sm hover:shadow-md hover:bg-[#e5c4c7] transition-all"
              >
                Add Your First Staff Member
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {staff.map((member) => {
                const memberId = member.id || member._id;
                return (
                  <div
                    key={memberId}
                    className="bg-white rounded-2xl border border-[#F5F5F5] overflow-hidden hover:border-[#EECFD1] hover:shadow-lg transition-all duration-300 flex flex-col group"
                  >
                    {/* Photo Section */}
                    <div className="p-6 pb-4">
                      <div className="flex justify-center mb-4">
                        {member.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.photo}
                            alt={member.name}
                            className="w-20 h-20 rounded-full object-cover border-4 border-[#EECFD1]/20 shadow-md"
                          />
                        ) : (
                          <div className="relative">
                            <div className="w-20 h-20 rounded-full bg-[#EECFD1] flex items-center justify-center shadow-md">
                              <span className="text-2xl font-bold text-white">
                                {member.name?.charAt(0)?.toUpperCase() || "S"}
                              </span>
                            </div>
                            {member.isActive && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                <CheckCircle2 className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Name */}
                      <h3 className="text-lg font-bold text-[#3A3A3A] mb-2 text-center group-hover:text-[#EECFD1] transition-colors">
                        {member.name}
                      </h3>

                      {/* Status */}
                      <div className="flex justify-center mb-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${member.isActive
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                          }`}>
                          {member.isActive && <CheckCircle2 className="w-3 h-3" />}
                          {member.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>

                      {/* Qualifications */}
                      {member.qualifications && (
                        <div className="mb-4 p-3 bg-[#F5F5F5] rounded-lg">
                          <div className="flex items-start gap-2">
                            <Award className="w-4 h-4 text-[#EECFD1] mt-0.5 flex-shrink-0" />
                            <p className="text-xs text-[#3A3A3A] line-clamp-2 font-medium">
                              {member.qualifications}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* About */}
                      {member.about && (
                        <p className="text-sm text-[#888888] text-center line-clamp-3 flex-1 leading-relaxed mb-4">
                          {member.about}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-[#F5F5F5] mt-auto">
                      <Link
                        href={`/business/staff/${memberId}/edit`}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-[#EECFD1] font-semibold hover:bg-[#EECFD1] hover:text-white transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                        <span className="text-sm">Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(memberId)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 text-red-500 font-semibold hover:bg-red-500 hover:text-white transition-all border-l border-[#F5F5F5]"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="text-sm">Remove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

