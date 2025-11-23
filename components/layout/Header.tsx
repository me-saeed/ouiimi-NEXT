"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface HeaderProps {
  user?: {
    fname: string;
    lname: string;
    email: string;
  } | null;
}

export default function Header({ user }: HeaderProps) {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/signin");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-color-primary tracking-tight">
            ouiimi
          </h1>
        </Link>
        <nav className="flex items-center space-x-4">
          {user ? (
            <>
              <span className="hidden sm:inline-block text-sm text-gray-700">
                Welcome, <span className="font-medium">{user.fname}</span>
              </span>
              <button
                onClick={handleLogout}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-color-secondary text-white hover:bg-color-secondary/90 h-9 px-4 py-2"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-color-primary text-white hover:bg-color-primary/90 h-9 px-4 py-2"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

