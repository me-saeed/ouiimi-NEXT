"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { Building2, LayoutDashboard, Briefcase, Users, MapPin, Mail, Phone, FileText } from "lucide-react";

export default function BusinessPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);

        // Fetch business data for this user
        const userId = parsedUser.id || parsedUser._id;
        if (userId) {
          fetch(`/api/business/search?userId=${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
            .then((res) => {
              if (res.ok) return res.json();
              throw new Error("Failed to fetch business");
            })
            .then((data) => {
              if (data.businesses && data.businesses.length > 0) {
                setBusiness(data.businesses[0]);
              }
            })
            .catch((err) => {
              console.error("Error fetching business:", err);
            })
            .finally(() => {
              setIsLoading(false);
            });
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error parsing user data:", e);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <PageLayout user={user}>
        <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-gradient-to-b from-background via-secondary/5 to-background min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {business ? (
            <div className="space-y-8">
              {/* Business Header Card */}
              <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-8 md:p-10">
                <div className="flex flex-col md:flex-row gap-6 md:gap-8">
                  {/* Business Logo/Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 flex items-center justify-center border-2 border-border/50 shadow-lg">
                      {business.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={business.logo}
                          alt={business.businessName}
                          className="w-full h-full rounded-2xl object-cover"
                        />
                      ) : (
                        <Building2 className="w-12 h-12 text-primary" />
                      )}
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                        {business.businessName}
                      </h1>
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          business.status === "approved" 
                            ? "bg-green-100 text-green-800" 
                            : business.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {business.status?.charAt(0).toUpperCase() + business.status?.slice(1) || "Pending"}
                        </span>
                      </div>
                    </div>

                    {/* Business Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      {business.address && (
                        <div className="flex items-start gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                          <span className="line-clamp-2">{business.address}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>{business.email}</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4 flex-shrink-0 text-primary" />
                          <span>{business.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Business Story */}
                    {business.story && (
                      <div className="pt-4 border-t border-border/50">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                          <p className="text-sm text-muted-foreground leading-relaxed">{business.story}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/business/dashboard"
                  className="group bg-card rounded-2xl shadow-lg border border-border/50 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <LayoutDashboard className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Dashboard
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    View your business overview, analytics, and recent activity
                  </p>
                </Link>

                <Link
                  href="/business/services"
                  className="group bg-card rounded-2xl shadow-lg border border-border/50 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Services
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your service listings, pricing, and availability
                  </p>
                </Link>

                <Link
                  href="/business/staff"
                  className="group bg-card rounded-2xl shadow-lg border border-border/50 p-8 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Users className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    Staff
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your team members and their profiles
                  </p>
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-2xl shadow-xl border border-border/50 p-12 text-center max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto">
                  <Building2 className="w-10 h-10 text-primary" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Start Your Business Journey
              </h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Register your business to start listing services and connect with customers
              </p>
              <Link
                href="/business/register"
                className="btn-polished btn-polished-primary inline-block rounded-xl px-8 py-3 font-semibold shadow-lg hover:shadow-xl transition-all"
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

