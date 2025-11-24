"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

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
        loadBusinessAndStaff();
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to remove staff member");
      }
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      alert(error.message || "Failed to remove staff member. Please try again.");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#3A3A3A]">Staff</h1>
            <Link
              href="/business/staff/add"
              className="bg-[#EECFD1] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#EECFD1]/90 transition-colors"
            >
              Add Staff
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="card-polished p-12 text-center max-w-md mx-auto">
              <div className="mb-6">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <p className="text-[#3A3A3A] font-semibold mb-2 text-lg">No staff members yet</p>
              <p className="text-[#3A3A3A]/70 text-sm mb-6">Add your team members to get started</p>
              <Link
                href="/business/staff/add"
                className="btn-polished btn-polished-primary inline-block"
              >
                Add Your First Staff Member
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {staff.map((member) => {
                const memberId = member.id || member._id;
                return (
                  <div
                    key={memberId}
                    className="card-polished p-6"
                  >
                    {member.photo && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={member.photo}
                        alt={member.name}
                        className="w-20 h-20 rounded-full object-cover mx-auto mb-4"
                      />
                    )}
                    <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 text-center">
                      {member.name}
                    </h3>
                    {member.qualifications && (
                      <p className="text-sm text-[#3A3A3A]/70 mb-4 text-center">
                        {member.qualifications}
                      </p>
                    )}
                    <div className="flex space-x-3 mt-6">
                      <Link
                        href={`/business/staff/${memberId}/edit`}
                        className="flex-1 btn-polished btn-polished-primary text-center text-sm py-2.5"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(memberId)}
                        className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
                      >
                        Remove
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

