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
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-2">Staff Members</h1>
              <p className="text-muted-foreground">Manage your team members</p>
            </div>
            <Link
              href="/business/staff/add"
              className="btn-polished btn-polished-primary px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all whitespace-nowrap"
            >
              Add Staff
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : staff.length === 0 ? (
            <div className="bg-card rounded-2xl shadow-lg border border-border/50 p-12 text-center max-w-md mx-auto">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-foreground font-semibold mb-2 text-lg">No staff members yet</p>
              <p className="text-muted-foreground text-sm mb-6">Add your team members to get started</p>
              <Link
                href="/business/staff/add"
                className="btn-polished btn-polished-primary inline-block rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all"
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
                    className="bg-card rounded-2xl shadow-lg border border-border/50 p-6 hover:shadow-xl transition-all duration-300 flex flex-col"
                  >
                    {/* Photo Section */}
                    <div className="flex justify-center mb-5">
                      {member.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-24 h-24 rounded-full object-cover border-4 border-border/50 shadow-md"
                        />
                      ) : (
                        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center border-4 border-border/50 shadow-md">
                          <span className="text-3xl font-bold text-foreground">
                            {member.name?.charAt(0)?.toUpperCase() || "S"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <h3 className="text-xl font-bold text-foreground mb-3 text-center">
                      {member.name}
                    </h3>

                    {/* Qualifications */}
                    {member.qualifications && (
                      <div className="mb-4 text-center">
                        <span className="inline-block px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                          {member.qualifications}
                        </span>
                      </div>
                    )}

                    {/* About */}
                    {member.about && (
                      <p className="text-sm text-muted-foreground mb-6 text-center line-clamp-3 flex-1">
                        {member.about}
                      </p>
                    )}

                    {/* Status Badge */}
                    <div className="mb-6 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        member.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {member.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4 border-t border-border/50 mt-auto">
                      <Link
                        href={`/business/staff/${memberId}/edit`}
                        className="flex-1 btn-polished btn-polished-primary text-center text-sm py-2.5 rounded-xl font-semibold"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(memberId)}
                        className="flex-1 bg-red-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors shadow-sm hover:shadow-md"
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

