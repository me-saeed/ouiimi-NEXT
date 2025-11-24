"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function BusinessPage() {
  const [user, setUser] = useState<any>(null);
  const [business, setBusiness] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        // TODO: Fetch business data for this user
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    }
  }, []);

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">
              Small Business
            </h1>
            <p className="text-lg text-[#3A3A3A] mb-8">
              Manage your business, services, and bookings
            </p>

            {business ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link
                  href="/business/dashboard"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                    Dashboard
                  </h3>
                  <p className="text-sm text-[#3A3A3A]/70">
                    View your business overview
                  </p>
                </Link>
                <Link
                  href="/business/services"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                    Services
                  </h3>
                  <p className="text-sm text-[#3A3A3A]/70">
                    Manage your services
                  </p>
                </Link>
                <Link
                  href="/business/staff"
                  className="card-polished p-8 hover:shadow-xl transition-all duration-300 group"
                >
                  <h3 className="text-xl font-bold text-[#3A3A3A] mb-2 group-hover:text-black transition-colors">
                    Staff
                  </h3>
                  <p className="text-sm text-[#3A3A3A]/70">
                    Manage your staff
                  </p>
                </Link>
              </div>
            ) : (
              <div className="card-polished p-12 text-center max-w-2xl mx-auto">
                <div className="mb-6">
                  <svg className="w-20 h-20 mx-auto text-[#EECFD1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-[#3A3A3A] mb-4">
                  Start Your Business Journey
                </h2>
                <p className="text-[#3A3A3A]/70 mb-8">
                  Register your business to start listing services and connect with customers
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
      </div>
    </PageLayout>
  );
}

