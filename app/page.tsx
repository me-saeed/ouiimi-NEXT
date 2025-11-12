"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Check if user is logged in
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
    <div className="min-h-screen bg-color-bg">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-color-primary">Ouiimi</h1>
            </div>
            <nav className="flex items-center space-x-4">
              {user ? (
                <>
                  <span className="text-sm text-gray-700">
                    Welcome, {user.fname} {user.lname}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="btn-styl"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" className="btn-styl">
                    Sign In
                  </Link>
                  <Link href="/signup" className="btn-styl">
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-color-black mb-4">
            Welcome to Ouiimi
          </h2>
          <p className="text-lg text-color-gray mb-8">
            Your secure authentication system is ready!
          </p>

          {user ? (
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold mb-4 text-color-primary">
                User Dashboard
              </h3>
              <div className="text-left space-y-2">
                <p>
                  <strong>Name:</strong> {user.fname} {user.lname}
                </p>
                <p>
                  <strong>Email:</strong> {user.email}
                </p>
                <p>
                  <strong>Username:</strong> {user.username || "N/A"}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
              <h3 className="text-2xl font-semibold mb-4 text-color-primary">
                Get Started
              </h3>
              <p className="text-color-gray mb-6">
                Sign up or sign in to access your account and explore all the
                features.
              </p>
              <div className="flex justify-center space-x-4">
                <Link href="/signup" className="btn-styl">
                  Create Account
                </Link>
                <Link href="/signin" className="btn-styl">
                  Sign In
                </Link>
              </div>
            </div>
          )}

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-4">🔐</div>
              <h3 className="text-xl font-semibold mb-2 text-color-primary">
                Secure Authentication
              </h3>
              <p className="text-color-gray">
                JWT-based authentication with bcrypt password hashing
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-4">🔑</div>
              <h3 className="text-xl font-semibold mb-2 text-color-primary">
                Password Reset
              </h3>
              <p className="text-color-gray">
                Secure password reset functionality with email verification
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="text-3xl mb-4">🌐</div>
              <h3 className="text-xl font-semibold mb-2 text-color-primary">
                OAuth Integration
              </h3>
              <p className="text-color-gray">
                Sign in with Google or Facebook for quick access
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-color-gray">
            <p>&copy; 2024 Ouiimi. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
