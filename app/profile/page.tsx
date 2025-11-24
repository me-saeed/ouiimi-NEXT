"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import PageLayout from "@/components/layout/PageLayout";

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error("Error parsing user data:", e);
      }
    } else {
      router.push("/signin");
    }
  }, [router]);

  if (!user) {
    return null;
  }

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8">
              Profile
            </h1>
            <div className="bg-[#D9D9D9] rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold text-[#3A3A3A]">
                    Name
                  </label>
                  <p className="text-[#3A3A3A]">
                    {user.fname} {user.lname}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-[#3A3A3A]">
                    Email
                  </label>
                  <p className="text-[#3A3A3A]">{user.email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

