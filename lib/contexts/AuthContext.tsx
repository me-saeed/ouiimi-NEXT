"use client";

import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

interface User {
    id?: string;
    _id?: string;
    fname: string;
    lname: string;
    email: string;
    contactNo?: string;
    phone?: string;
    pic?: string;
    role?: string; // Singular role from session
    roles?: string[]; // Kept for backward compatibility
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    token: string | null;
    isLoading: boolean;
    hasRole: (role: string) => boolean;
    isAdmin: boolean;
    refreshSession: () => Promise<void>; // Force refresh session from server
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const previousPathRef = useRef<string | null>(null);

    // Load user from session API
    const loadSession = async () => {
        setIsLoading(true);
        try {
            console.log("[AuthContext] Loading session...");
            const response = await fetch('/api/auth/session', { cache: 'no-store' });

            if (!response.ok) {
                throw new Error(`Session fetch failed: ${response.status}`);
            }

            const data = await response.json();

            if (data.success && data.data.authenticated) {
                console.log("[AuthContext] Session loaded for:", data.data.user.email);
                // Standardize role to lowercase and roles array for component logic
                const userData = data.data.user;
                if (userData.role) {
                    userData.role = userData.role.toLowerCase();
                    if (!userData.roles) {
                        userData.roles = [userData.role];
                    }
                }
                setUser(userData);
            } else {
                console.log("[AuthContext] No active session found");
                setUser(null);
            }
        } catch (error) {
            console.error("[AuthContext] Error loading session:", error);
            // Don't immediately clear user if it's a network error? 
            // Actually, best to follow API truth.
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadSession();
    }, []);

    // Auto-logout after 15 minutes of inactivity
    useEffect(() => {
        if (!user) return;

        const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes in milliseconds
        let timeoutId: NodeJS.Timeout;

        const resetTimer = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                console.log("Auto-logout due to inactivity");
                logout();
                // Redirect to signin with message
                if (typeof window !== 'undefined') {
                    window.location.href = '/signin?reason=timeout';
                }
            }, INACTIVITY_TIMEOUT);
        };

        // Activity events to track
        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];

        // Add event listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        // Start the timer
        resetTimer();

        // Cleanup
        return () => {
            clearTimeout(timeoutId);
            activityEvents.forEach(event => {
                document.removeEventListener(event, resetTimer);
            });
        };
    }, [user, token]);

    // ==========================================================================
    // Business Session Cleanup: Clear ONLY when navigating to /profile
    // ==========================================================================
    useEffect(() => {
        const isBusinessRoute = (path: string | null) => {
            if (!path) return false;
            return path.startsWith('/business/dashboard') ||
                path.startsWith('/business/services') ||
                path.startsWith('/business/staff') ||
                path.startsWith('/business/profile');
        };

        const isProfileRoute = (path: string | null) => {
            if (!path) return false;
            return path === '/profile' || path.startsWith('/profile/');
        };

        const previousPath = previousPathRef.current;
        const wasOnBusinessRoute = isBusinessRoute(previousPath);
        const isNowOnProfile = isProfileRoute(pathname);

        // Only clear business session when going FROM business route TO /profile
        if (wasOnBusinessRoute && isNowOnProfile && user) {
            console.log('[AuthContext] Navigated to profile from business, clearing business session');
            fetch('/api/auth/business-session', {
                method: 'DELETE',
                credentials: 'include'
            }).catch(err => {
                console.error('[AuthContext] Error clearing business session:', err);
            });
        }

        // Update previous path
        previousPathRef.current = pathname;
    }, [pathname, user]);

    const login = (newToken: string, userData: User) => {
        // Standardize role to roles array for component logic
        if (userData.role && !userData.roles) {
            userData.roles = [userData.role];
        }
        setUser(userData);
    };

    const logout = async () => {
        try {
            // Call server to destroy HttpOnly session cookie
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            setToken(null);
            setUser(null);
        }
    };

    // Role checking methods
    const hasRole = (role: string): boolean => {
        return user?.roles?.includes(role) || false;
    };

    const isAdmin = user?.roles?.includes('admin') || false;

    const value: AuthContextType = {
        user,
        setUser,
        login,
        logout,
        isAuthenticated: !!user,  // Session-based, no token needed
        token,
        isLoading,
        hasRole,
        isAdmin,
        refreshSession: loadSession,
    };

    // Always render children to prevent white screen
    // Components can check isLoading from context if needed
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
