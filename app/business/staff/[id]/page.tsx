"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StaffDetailPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params?.id as string;
  const [user, setUser] = useState<any>(null);
  const [staff, setStaff] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        loadStaff();
      } catch (e) {
        console.error("Error parsing user data:", e);
        router.push("/signin");
      }
    } else {
      router.push("/signin");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId, router]);

  const loadStaff = async () => {
    if (!staffId) return;

    setIsLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/${staffId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStaff(data.staff);
      } else {
        setError("Failed to load staff member");
      }
    } catch (e) {
      console.error("Error loading staff:", e);
      setError("Failed to load staff member");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this staff member? This action cannot be undone.")) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push("/business/dashboard");
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to delete staff member");
      }
    } catch (error: any) {
      console.error("Error deleting staff:", error);
      alert(error.message || "Failed to delete staff member. Please try again.");
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

  if (isLoading) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#EECFD1]"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !staff) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">Staff Member Not Found</h2>
              <p className="text-muted-foreground mb-6">{error || "The staff member you're looking for doesn't exist."}</p>
              <Button variant="pink" size="lg" asChild>
                <Link href="/business/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-2xl">
          {/* Staff Detail Card - Light grey, smooth rounded corners */}
          <div className="relative bg-gray-100 rounded-2xl p-8 md:p-10 shadow-sm">
            {/* Delete Button - Top Right */}
            <button
              onClick={handleDelete}
              className="absolute top-4 right-4 p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors"
              aria-label="Delete staff member"
            >
              <Trash2 className="w-5 h-5" />
            </button>

            {/* Avatar - Large, centered, light pink background */}
            <div className="flex justify-center mb-6">
              <div className="w-28 h-28 rounded-full bg-[#EECFD1] flex items-center justify-center">
                {staff.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={staff.photo}
                    alt={staff.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-[#3A3A3A]">
                    {staff.name?.charAt(0)?.toUpperCase() || "S"}
                  </span>
                )}
              </div>
            </div>

            {/* Name - Centered, bold */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-[#3A3A3A]">{staff.name}</h1>
            </div>

            {/* About Section - Clean, left-aligned */}
            <div className="mb-8">
              <h2 className="text-lg font-bold text-[#3A3A3A] mb-4">About staff member and qualifications</h2>
              <div className="space-y-4">
                {staff.qualifications && (
                  <div>
                    <p className="text-sm font-semibold text-[#3A3A3A] mb-1">Qualifications</p>
                    <p className="text-[#3A3A3A]">{staff.qualifications}</p>
                  </div>
                )}
                {(staff.about || staff.bio) && (
                  <div>
                    <p className="text-sm font-semibold text-[#3A3A3A] mb-1">About</p>
                    <p className="text-[#3A3A3A] leading-relaxed whitespace-pre-wrap">
                      {staff.about || staff.bio}
                    </p>
                  </div>
                )}
                {!staff.qualifications && !staff.about && !staff.bio && (
                  <div>
                    <p className="text-sm font-semibold text-[#3A3A3A] mb-1">About</p>
                    <p className="text-[#888888]">No additional information available.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Button - Light pink border, centered */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="lg"
                className="border-2 border-[#EECFD1] bg-white text-[#EECFD1] hover:bg-[#EECFD1] hover:text-white rounded-xl px-8 py-2.5 font-semibold transition-all"
                onClick={() => router.push(`/business/staff/${staffId}/edit`)}
              >
                Edit Details
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
