"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const links = [
    { href: "/about", label: "About" },
    { href: "/shopper", label: "Shopper" },
    { href: "/business/dashboard", label: "Small Business" },
    { href: "/how-it-works", label: "How it works" },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* Close button for mobile */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <h2 className="text-lg font-semibold text-[#3A3A3A]">Menu</h2>
            <button
              onClick={onClose}
              className="text-[#3A3A3A] hover:text-black"
              aria-label="Close menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {links.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`block px-4 py-3 rounded-md transition-colors ${
                        isActive
                          ? "bg-[#EECFD1] text-[#3A3A3A] font-medium"
                          : "text-[#3A3A3A] hover:bg-gray-100"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}

