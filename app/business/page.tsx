"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";

export default function BusinessPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    const checkAndRedirect = async () => {
      // Wait for auth to load
      if (isLoading) return;

      // If not authenticated, go to register page (will show auth modal)
      if (!isAuthenticated || !user) {
        router.replace('/business/register');
        return;
      }

      // Check if user already has a business
      try {
        const response = await fetch(
          `/api/business/search?userId=${user.id || user._id}`,
          { credentials: 'include' }
        );

        if (response.ok) {
          const data = await response.json();
          const businesses = data.data?.businesses || data.businesses;

          if (businesses && businesses.length > 0) {
            // Has business → Go to dashboard
            console.log('[BUSINESS ROUTER] Existing business found, redirecting to dashboard');
            router.replace('/business/dashboard');
          } else {
            // No business → Go to registration
            console.log('[BUSINESS ROUTER] No business found, redirecting to registration');
            router.replace('/business/register');
          }
        } else {
          // Error checking, default to register
          router.replace('/business/register');
        }
      } catch (error) {
        console.error('[BUSINESS ROUTER] Error checking business:', error);
        router.replace('/business/register');
      }
    };

    checkAndRedirect();
  }, [user, isAuthenticated, isLoading, router]);

  // Show loading state while checking
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}
