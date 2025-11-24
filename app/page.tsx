"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

const SERVICE_CATEGORIES = [
  "Hair Services",
  "Nails",
  "Beauty & Brows",
  "Massage & Wellness",
  "Dog Grooming",
];

// Mock service data - will be replaced with API call
const generateMockServices = (category: string) => {
  return Array.from({ length: 6 }, (_, i) => ({
    id: `${category}-${i + 1}`,
    name: `${category} Service ${i + 1}`,
    price: Math.floor(Math.random() * 100) + 20,
    image: `https://via.placeholder.com/200x200?text=${category}+${i + 1}`,
  }));
};

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [services, setServices] = useState<Record<string, any[]>>({});

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

    // Load services for each category
    // TODO: Replace with actual API call
    const servicesData: Record<string, any[]> = {};
    SERVICE_CATEGORIES.forEach((category) => {
      servicesData[category] = generateMockServices(category);
    });
    setServices(servicesData);
  }, []);

  return (
    <PageLayout user={user}>
      <div className="bg-white min-h-screen">
        {/* Call to Action Bar */}
        <div className="bg-[#EECFD1] py-3 border-b border-[#EECFD1]/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <p className="text-center text-[#3A3A3A] text-sm sm:text-base font-semibold">
              <Link 
                href="/business/register" 
                className="hover:text-[#2A2A2A] transition-colors duration-200 inline-flex items-center gap-1"
              >
                Start selling today!!
                <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <section className="bg-white py-8 border-b border-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col sm:flex-row gap-3 max-w-4xl mx-auto">
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search ouiiwe"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent text-[#3A3A3A] placeholder:text-gray-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                />
              </div>
              <div className="flex-1 relative">
                <svg
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Location"
                  className="w-full pl-10 pr-4 py-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent text-[#3A3A3A] placeholder:text-gray-400 transition-all duration-200 bg-white shadow-sm hover:shadow-md"
                />
              </div>
              <button className="btn-polished btn-polished-primary whitespace-nowrap">
                SEARCH
              </button>
            </div>
          </div>
        </section>

        {/* Discover Section */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#3A3A3A] mb-2">
                Discover
              </h2>
              <p className="text-[#3A3A3A]/70 text-sm sm:text-base">
                Explore services from trusted local businesses
              </p>
            </div>

            {/* Service Categories */}
            {SERVICE_CATEGORIES.map((category, categoryIndex) => (
              <div
                key={category}
                className={`mb-16 sm:mb-20 ${
                  categoryIndex > 0 ? "border-t border-gray-200 pt-12 sm:pt-16" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#3A3A3A]">
                    {category}
                  </h3>
                  <Link
                    href={`/services?category=${encodeURIComponent(category)}`}
                    className="hidden sm:inline-flex items-center text-[#3A3A3A] font-semibold hover:text-black transition-colors text-sm group"
                  >
                    View all
                    <svg
                      className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Service Cards Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-5">
                  {services[category]?.slice(0, 6).map((service) => (
                    <Link
                      key={service.id}
                      href={`/services/${service.id}`}
                      className="group bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 border border-gray-100"
                    >
                      <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={service.image}
                          alt={service.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {/* Carousel dots indicator */}
                        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5 bg-black/20 backdrop-blur-sm px-2 py-1 rounded-full">
                          {[1, 2, 3, 4].map((dot) => (
                            <div
                              key={dot}
                              className={`w-1.5 h-1.5 rounded-full transition-all ${
                                dot === 1 ? "bg-white" : "bg-white/40"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-sm text-[#3A3A3A] font-semibold truncate mb-2 leading-tight">
                          {service.name}
                        </p>
                        <p className="text-base font-bold text-[#3A3A3A]">
                          ${service.price}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* More Button - Mobile */}
                <div className="mt-6 sm:hidden flex justify-end">
                  <Link
                    href={`/services?category=${encodeURIComponent(category)}`}
                    className="inline-flex items-center text-[#3A3A3A] font-semibold hover:text-black transition-colors text-sm"
                  >
                    More
                    <svg
                      className="w-4 h-4 ml-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}
