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
        <div className="bg-gray-50 min-h-screen py-12">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout user={user}>
      <div className="bg-gray-50 min-h-screen py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          {business ? (
            <div className="space-y-6">
              {/* Business Header Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  {/* Business Logo/Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center border-2 border-gray-300 shadow-sm overflow-hidden">
                      {business.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={business.logo}
                          alt={business.businessName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building2 className="w-12 h-12 text-gray-600" />
                      )}
                    </div>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 space-y-3 text-center md:text-left">
                    <div>
                      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                        {business.businessName}
                      </h1>
                      <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {business.status === "approved" ? "Active" : business.status}
                      </span>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-2 text-gray-600">
                      {business.address && (
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{business.address}</span>
                        </div>
                      )}
                      {business.email && (
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{business.email}</span>
                        </div>
                      )}
                      {business.phone && (
                        <div className="flex items-center justify-center md:justify-start gap-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span className="text-sm">{business.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Story/About */}
                    {business.story && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-600 leading-relaxed">{business.story}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Edit Button */}
                  <div className="flex-shrink-0">
                    <Link
                      href="/business/profile/edit"
                      className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm"
                    >
                      Edit Profile
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    href="/business/dashboard"
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                        <LayoutDashboard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Dashboard</h3>
                        <p className="text-sm text-gray-500">Manage your business</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/business/services"
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-100 transition-colors">
                        <Briefcase className="w-6 h-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Services</h3>
                        <p className="text-sm text-gray-500">View all services</p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/business/staff"
                    className="group bg-white rounded-xl border border-gray-200 p-6 hover:border-gray-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center group-hover:bg-green-100 transition-colors">
                        <Users className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Staff</h3>
                        <p className="text-sm text-gray-500">Manage team members</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            /* No Business - Registration Prompt */
            <div className="max-w-2xl mx-auto text-center">
              <div className="bg-white rounded-xl border border-gray-200 p-12 shadow-sm">
                <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
                  <Building2 className="w-10 h-10 text-gray-400" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">No Business Registered</h2>
                <p className="text-gray-600 mb-8 text-lg">
                  Register your business to start offering services and managing bookings
                </p>
                <Link
                  href="/business/register"
                  className="inline-block bg-gray-900 text-white px-8 py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors shadow-sm"
                >
                  Register Your Business
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
