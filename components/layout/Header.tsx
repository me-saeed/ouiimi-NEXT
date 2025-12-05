"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";

interface HeaderProps {
  user?: {
    fname: string;
    lname: string;
    email: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sidebarLinks = [
    { href: "/about", label: "About" },
    { href: "/profile", label: "Shopper" },
    { href: "/business", label: "Small Business" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#EECFD1]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between relative">
            {/* Left: Hamburger Menu (Mobile only) */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden text-white hover:bg-white/10 transition-all duration-200 p-2 rounded-lg tap-target"
              aria-label="Open menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>

            {/* Desktop Navigation (Left side - Desktop only) */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6">
              {sidebarLinks.map((link) => {
                const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-[14px] font-medium transition-all duration-200 px-3 py-2 rounded-lg ${isActive
                        ? "text-white bg-white/20"
                        : "text-white hover:bg-white/10"
                      }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* Center: Logo */}
            <Link href="/" className="flex items-center group absolute left-1/2 -translate-x-1/2">
              <h1 className="text-[22px] sm:text-[24px] font-serif italic text-white tracking-tight group-hover:text-white/90 transition-colors duration-200">
                ouiimi
              </h1>
            </Link>

            {/* Right: Cart Icon */}
            <Link
              href="/cart"
              className="text-white hover:bg-white/10 transition-all duration-200 p-2 rounded-lg relative tap-target ml-auto"
              aria-label="Shopping cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50 transition-opacity"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed left-0 top-0 h-full w-72 bg-white shadow-2xl z-50 transform transition-transform animate-in">
            <div className="p-6">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-bold text-[#3A3A3A]">Menu</h2>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-[#3A3A3A] hover:text-black p-2 hover:bg-gray-100 rounded-lg transition-all tap-target"
                  aria-label="Close menu"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <nav className="space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-5 py-3.5 rounded-lg text-[#3A3A3A] font-medium transition-all duration-200 ${isActive
                        ? "bg-[#EECFD1] text-[#3A3A3A] font-semibold"
                        : "hover:bg-[#EECFD1]/30 hover:text-[#3A3A3A]"
                        }`}
                    >
                      {link.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </>
      )}
    </>
  );
}

