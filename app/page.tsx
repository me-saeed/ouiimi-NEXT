"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function HomePage() {
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
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    router.push("/signin");
  };

  return (
    <PageLayout user={user}>
      <div className="bg-color-bg">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white to-color-bg py-20 sm:py-32">
          <div className="container">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-5xl font-bold tracking-tight text-color-black sm:text-6xl lg:text-7xl">
                Welcome to{" "}
                <span className="text-color-primary">ouiimi</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-color-gray sm:text-xl">
                Simple, fast, and stress-free booking for all your everyday services.
                From haircuts to dog grooming, discover and book with ease.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                {user ? (
                  <Link
                    href="/"
                    className="btn-styl btn-primary text-base px-6 py-3"
                  >
                    Go to Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="btn-styl btn-primary text-base px-6 py-3"
                    >
                      Get Started
                    </Link>
                    <Link
                      href="/signin"
                      className="btn-styl btn-outline text-base px-6 py-3"
                    >
                      Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 sm:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight text-color-black sm:text-4xl">
                Why Choose ouiimi?
              </h2>
              <p className="mt-4 text-lg text-color-gray">
                Everything you need to book your everyday services in one place
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  Secure & Safe
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Your data is protected with industry-standard security. Book with confidence.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  Fast & Simple
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Book appointments in minutes. No more juggling multiple apps or endless messages.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  Fair Pricing
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Transparent pricing with a simple 10% deposit. Pay the rest directly to the business.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">📍</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  Local Businesses
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Discover verified, high-quality service providers in your area.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  Easy Management
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Track and manage all your bookings from one convenient dashboard.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-md p-8 hover:shadow-lg transition-shadow duration-300">
                <div className="text-4xl mb-4">✨</div>
                <h3 className="text-xl font-semibold mb-3 text-color-black">
                  All Services
                </h3>
                <p className="text-color-gray leading-relaxed">
                  Hair, nails, beauty, massage, dog grooming, and more - all in one place.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        {!user && (
          <section className="bg-color-primary py-16 sm:py-20">
            <div className="container">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  Ready to get started?
                </h2>
                <p className="mt-4 text-lg leading-8 text-white/90">
                  Join ouiimi today and experience the simplest way to book your everyday services.
                </p>
                <div className="mt-10 flex items-center justify-center gap-x-6">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-base font-semibold text-color-primary shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-colors"
                  >
                    Create Account
                  </Link>
                  <Link
                    href="/about"
                    className="text-base font-semibold leading-6 text-white hover:text-white/80 transition-colors"
                  >
                    Learn more <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </PageLayout>
  );
}
