"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { BookingsTab } from "@/components/business/BookingsTab";
import { ListTab } from "@/components/business/ListTab";
import { StaffTab } from "@/components/business/StaffTab";
import { DetailsTab } from "@/components/business/DetailsTab";

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
  const [activeTab, setActiveTab] = useState<"bookings" | "list" | "staff" | "details">("bookings");

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
    return (
      <PageLayout user={null}>
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

  if (!business) {
    return (
      <PageLayout user={user}>
        <div className="bg-white min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center py-20">
              <h2 className="text-2xl font-semibold mb-4">No Business Found</h2>
              <p className="text-muted-foreground mb-6">
                You need to register a business first to access the dashboard.
              </p>
              <Link href="/business/register">
                <button className="btn-polished-primary">Register Business</button>
              </Link>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-background min-h-screen py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="bg-secondary/30 rounded-t-3xl p-8 mb-0">
            <div className="flex flex-col items-center text-center space-y-4">
              <h1 className="text-4xl font-serif italic text-secondary-foreground">ouiimi</h1>

              {business?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {business?.businessName?.charAt(0) || "B"}
                  </span>
                </div>
              )}

              <h2 className="text-xl font-medium text-foreground">{business?.businessName}</h2>
            </div>
          </div>

          {/* Main Navigation Tabs */}
          <div className="bg-white border-b border-border/50 sticky top-0 z-10 shadow-sm">
            <div className="flex justify-center w-full max-w-3xl mx-auto">
              <button
                onClick={() => setActiveTab("bookings")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "bookings" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Bookings
                {activeTab === "bookings" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "list" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                List
                {activeTab === "list" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => setActiveTab("staff")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "staff" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Staff
                {activeTab === "staff" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
              <button
                onClick={() => setActiveTab("details")}
                className={`flex-1 py-4 text-sm font-medium transition-colors relative ${activeTab === "details" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Details
                {activeTab === "details" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-white min-h-[500px] p-6 md:p-8">
            {activeTab === "bookings" && <BookingsTab business={business} />}
            {activeTab === "list" && <ListTab business={business} />}
            {activeTab === "staff" && <StaffTab business={business} />}
            {activeTab === "details" && <DetailsTab business={business} />}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

