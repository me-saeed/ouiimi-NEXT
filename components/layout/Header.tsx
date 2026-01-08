"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

interface HeaderProps {
  user?: {
    fname: string;
    lname: string;
    email: string;
  } | null;
}

import { useAuth } from "@/lib/contexts/AuthContext";

export default function Header({ user: userProp }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isLoading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  // Cart check effect
  useEffect(() => {
    // ... (rest of cart effect remains same)
    const checkCart = () => {
      if (typeof window === "undefined") return;
      const savedCart = localStorage.getItem("cart");
      if (savedCart) {
        try {
          const cart = JSON.parse(savedCart);
          setCartCount(Array.isArray(cart) ? cart.length : 0);
        } catch (e) {
          setCartCount(0);
        }
      } else {
        setCartCount(0);
      }
    };

    checkCart();
    window.addEventListener("storage", checkCart);
    const interval = setInterval(checkCart, 1000);

    return () => {
      window.removeEventListener("storage", checkCart);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    setProfileDropdownOpen(false);
    setSidebarOpen(false);
    router.push("/");
  };

  const getUserInitials = () => {
    if (!user) return "";
    const fname = user.fname || "";
    const lname = user.lname || "";
    return `${fname.charAt(0)}${lname.charAt(0)}`.toUpperCase();
  };

  const sidebarLinks = [
    { href: "/about", label: "About" },
    { href: "/profile", label: "Shopper" },
    { href: "/business", label: "Small Business" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-[#EECFD1]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
          <div className="flex h-16 items-center justify-between relative">
            {/* Mobile: Hamburger Menu */}
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

            {/* Mobile: Logo (Center) - 10% bigger */}
            <Link href="/" className="md:hidden flex items-center group absolute left-1/2 -translate-x-1/2">
              <h1 className="text-[24px] font-serif text-white tracking-tight group-hover:text-white/90 transition-colors duration-200" style={{ fontFamily: 'var(--font-serif)' }}>
                ouiimi
              </h1>
            </Link>

            {/* Desktop: Logo (Left) - increased letter spacing, closer to nav */}
            <Link href="/" className="hidden md:flex items-center group mr-6">
              <h1 className="text-[26px] font-serif text-white tracking-widest group-hover:text-white/90 transition-colors duration-200" style={{ fontFamily: 'var(--font-serif)' }}>
                ouiimi
              </h1>
            </Link>

            {/* Desktop: Navigation (Center) */}
            <nav className="hidden md:flex items-center gap-4 lg:gap-6 absolute left-1/2 -translate-x-1/2">
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

            {/* Right: Authentication UI */}
            <div className="flex items-center gap-3">
              {user ? (
                // Logged in - Show profile dropdown
                <div className="relative hidden md:block">
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 text-white hover:bg-white/10 transition-all duration-200 px-3 py-2 rounded-lg"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-semibold">
                      {getUserInitials()}
                    </div>
                    <svg
                      className={`w-4 h-4 transition-transform ${profileDropdownOpen ? "rotate-180" : ""}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg py-2 z-50 border border-gray-100">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900">
                            {user.fname}
                          </p>
                        </div>
                        <Link
                          href="/profile"
                          onClick={() => setProfileDropdownOpen(false)}
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Profile
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          Sign Out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                // Not logged in - Show Sign In/Sign Up as underlined text
                <>
                  <Link
                    href="/signin"
                    className="hidden sm:block text-white underline hover:text-white/80 transition-all duration-200 px-3 py-2 text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="hidden sm:block text-white underline hover:text-white/80 transition-all duration-200 px-3 py-2 text-sm font-medium"
                  >
                    Sign Up
                  </Link>
                </>
              )}

              {/* Cart Icon */}
              <Link
                href="/cart"
                className="text-white hover:bg-white/10 transition-all duration-200 p-2 rounded-lg relative tap-target"
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
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </Link>
            </div>
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
          <div className="fixed left-0 top-0 h-full w-64 sm:w-72 bg-white shadow-2xl z-50 transform transition-transform animate-in">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-6 sm:mb-10">
                <h2 className="text-xl sm:text-2xl font-bold text-[#3A3A3A]">Menu</h2>
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

              {/* Authentication Section */}
              {user ? (
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="flex items-center gap-3 px-3 sm:px-5 py-2.5 sm:py-3 bg-[#EECFD1]/10 rounded-lg">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#EECFD1] flex items-center justify-center text-white text-sm font-semibold">
                      {getUserInitials()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                        {user.fname}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="mb-6 pb-6 border-b border-gray-200 space-y-3">
                  <Link
                    href="/signin"
                    onClick={() => setSidebarOpen(false)}
                    className="block px-3 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-[#3A3A3A] font-medium underline text-center hover:text-[#888] transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setSidebarOpen(false)}
                    className="block px-3 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-[#3A3A3A] font-medium underline text-center hover:text-[#888] transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              <nav className="space-y-2">
                {sidebarLinks.map((link) => {
                  const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 sm:px-5 py-2.5 sm:py-3.5 rounded-lg text-sm sm:text-base text-[#3A3A3A] font-medium transition-all duration-200 ${isActive
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

