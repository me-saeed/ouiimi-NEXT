"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

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

  const navLinks = [
    { href: "/business", label: "Small Business" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-[#EECFD1] text-black shadow-lg border-b border-[#EECFD1]/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo */}
          <Link href="/" className="flex items-center group">
            <h1 className="text-xl sm:text-2xl font-bold text-black tracking-tight group-hover:text-black/80 transition-colors duration-200">
              ouiimi
            </h1>
          </Link>

          {/* Center: Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg text-sm lg:text-base font-medium transition-all duration-200 ${
                    isActive
                      ? "text-black bg-black/10 font-semibold"
                      : "text-black/80 hover:text-black hover:bg-black/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right: Icons */}
          <div className="flex items-center space-x-3">
            {/* User Icon */}
            {user ? (
              <Link
                href="/profile"
                className="text-black/90 hover:text-black hover:bg-black/10 transition-all duration-200 p-2 rounded-lg"
                aria-label="User profile"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            ) : (
              <Link
                href="/signin"
                className="text-black/90 hover:text-black hover:bg-black/10 transition-all duration-200 p-2 rounded-lg"
                aria-label="Sign in"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
              </Link>
            )}

            {/* Cart Icon */}
            <Link
              href="/cart"
              className="text-black/90 hover:text-black hover:bg-black/10 transition-all duration-200 p-2 rounded-lg relative"
              aria-label="Shopping cart"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
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
      </div>
    </header>
  );
}

