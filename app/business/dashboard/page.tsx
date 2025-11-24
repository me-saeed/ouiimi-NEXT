"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function BusinessDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState({
    services: 0,
    staff: 0,
    bookings: 0,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");
      
      if (!token || !userData) {
        router.push("/signin");
        return;
      }

      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        const userId = parsedUser.id || parsedUser._id;

        if (!userId) {
          console.error("User ID not found");
          setIsLoading(false);
          return;
        }

        // Fetch business by userId
        const businessResponse = await fetch(`/api/business/search?userId=${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (businessResponse.ok) {
          const businessData = await businessResponse.json();
          if (businessData.businesses && businessData.businesses.length > 0) {
            const businessItem = businessData.businesses[0];
            setBusiness(businessItem);
            
            const businessId = businessItem._id || businessItem.id;

            // Fetch stats
            const [servicesRes, staffRes] = await Promise.all([
              fetch(`/api/services?businessId=${businessId}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
              fetch(`/api/staff?businessId=${businessId}`, {
                headers: { Authorization: `Bearer ${token}` },
              }),
            ]);

            if (servicesRes.ok) {
              const servicesData = await servicesRes.json();
              setStats((prev) => ({
                ...prev,
                services: servicesData.services?.length || 0,
              }));
            }

            if (staffRes.ok) {
              const staffData = await staffRes.json();
              setStats((prev) => ({
                ...prev,
                staff: staffData.staff?.length || 0,
              }));
            }
          }
        } else if (businessResponse.status === 404) {
          // No business found - this is okay, show register message
          console.log("No business found for user");
        }
      } catch (e) {
        console.error("Error loading dashboard data:", e);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [router]);

  if (!user) {
    return null;
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

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-4xl font-bold text-[#3A3A3A]">
              Business Dashboard
            </h1>
            {business && (
              <Link
                href="/business/profile/edit"
                className="btn-polished btn-polished-secondary"
              >
                Edit Profile
              </Link>
            )}
          </div>

          {business ? (
            <>
              {/* Business Info Card */}
              <div className="card-polished p-6 mb-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-[#3A3A3A] mb-2">
                      {business.businessName}
                    </h2>
                    <p className="text-[#3A3A3A]/70 mb-1">
                      {business.email}
                    </p>
                    {business.phone && (
                      <p className="text-[#3A3A3A]/70 mb-1">
                        {business.phone}
                      </p>
                    )}
                    <p className="text-[#3A3A3A]/70 mb-4">
                      {business.address}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        business.status === 'approved' 
                          ? 'bg-green-100 text-green-800' 
                          : business.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {business.status?.toUpperCase() || 'PENDING'}
                      </span>
                    </div>
                  </div>
                  {business.logo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img 
                      src={business.logo} 
                      alt={business.businessName}
                      className="w-24 h-24 rounded-lg object-cover"
                    />
                  )}
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="card-polished p-6">
                  <h3 className="text-sm font-semibold text-[#3A3A3A]/70 mb-3 uppercase tracking-wide">
                    Services
                  </h3>
                  <p className="text-4xl font-bold text-[#3A3A3A]">
                    {stats.services}
                  </p>
                </div>
                <div className="card-polished p-6">
                  <h3 className="text-sm font-semibold text-[#3A3A3A]/70 mb-3 uppercase tracking-wide">
                    Staff
                  </h3>
                  <p className="text-4xl font-bold text-[#3A3A3A]">
                    {stats.staff}
                  </p>
                </div>
                <div className="card-polished p-6">
                  <h3 className="text-sm font-semibold text-[#3A3A3A]/70 mb-3 uppercase tracking-wide">
                    Bookings
                  </h3>
                  <p className="text-4xl font-bold text-[#3A3A3A]">
                    {stats.bookings}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Link
                  href="/business/services"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                        Manage Services
                      </h3>
                      <p className="text-sm text-[#3A3A3A]/70">
                        Add, edit, or remove services
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#EECFD1] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  href="/business/staff"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                        Manage Staff
                      </h3>
                      <p className="text-sm text-[#3A3A3A]/70">
                        Add or manage staff members
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#EECFD1] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
                <Link
                  href="/business/bank-details"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                        Bank Details
                      </h3>
                      <p className="text-sm text-[#3A3A3A]/70">
                        Manage payment information
                      </p>
                    </div>
                    <svg className="w-6 h-6 text-[#EECFD1] group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              </div>
            </>
          ) : (
            <div className="card-polished p-12 text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <svg className="w-20 h-20 mx-auto text-[#EECFD1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[#3A3A3A] mb-4">
                No Business Found
              </h2>
              <p className="text-[#3A3A3A]/70 mb-8">
                Register your business to get started and start listing your services
              </p>
              <Link
                href="/business/register"
                className="btn-polished btn-polished-primary inline-block"
              >
                Register Business
              </Link>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}

