"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/contexts/AuthContext";
import { BusinessAuthModal } from "@/components/business/BusinessAuthModal";

export default function BusinessPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Memoized redirect function to avoid useEffect re-runs
  const handleRedirect = useCallback((path: string) => {
    setIsRedirecting(true);
    router.replace(path);
  }, [router]);

  useEffect(() => {
    // Prevent running if already redirecting
    if (isRedirecting) return;

    const checkAndRedirect = async () => {
      // Wait for auth to load
      if (isLoading) return;

      // If not authenticated, go to register page
      if (!isAuthenticated || !user) {
        handleRedirect('/business/register');
        return;
      }

      // Check for business session directly (single API call)
      try {
        const response = await fetch('/api/auth/business-session/check', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          // API error - show auth modal
          setShowAuthModal(true);
          return;
        }

        const data = await response.json();
        const hasBusinessSession = data.data?.hasSession === true;

        if (!hasBusinessSession) {
          // No business session - show re-auth modal immediately
          setShowAuthModal(true);
          return;
        }

        // Has business session - check if user has a business
        const bizResponse = await fetch(
          `/api/business/search?userId=${user.id || user._id}`,
          { credentials: 'include' }
        );

        if (bizResponse.ok) {
          const bizData = await bizResponse.json();
          const businesses = bizData.data?.businesses || bizData.businesses;

          if (businesses && businesses.length > 0) {
            handleRedirect('/business/dashboard');
          } else {
            handleRedirect('/business/register');
          }
        } else {
          handleRedirect('/business/register');
        }
      } catch (error) {
        console.error('[BUSINESS ROUTER] Error:', error);
        setShowAuthModal(true);
      }
    };

    checkAndRedirect();
  }, [user, isAuthenticated, isLoading, isRedirecting, handleRedirect]);

  // Handle modal close - go home
  const handleModalClose = useCallback(() => {
    setShowAuthModal(false);
    handleRedirect('/');
  }, [handleRedirect]);

  // If auth still loading, show minimal loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
      </div>
    );
  }

  // Show auth modal (no intermediate loading state)
  if (showAuthModal) {
    return (
      <BusinessAuthModal
        isOpen={true}
        onClose={handleModalClose}
        redirectTo="/business/dashboard"
      />
    );
  }

  // Redirecting state - minimal indicator
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
    </div>
  );
}
