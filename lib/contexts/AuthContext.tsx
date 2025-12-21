"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    id?: string;
    _id?: string;
    fname: string;
    lname: string;
    email: string;
    phone?: string;
    roles?: string[]; // User roles for authorization
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (token: string, userData: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    token: string | null;
    isLoading: boolean; // Indicates if auth state is being initialized
    hasRole: (role: string) => boolean; // Check if user has specific role
    isAdmin: boolean; // Quick check for admin role
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        try {
            const storedToken = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (storedToken && storedUser) {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
                // Ensure cookie is set for middleware - Simple format for maximum compatibility
                document.cookie = `token=${storedToken}; path=/`;
            }
        } catch (error) {
            console.error("Error loading auth state:", error);
            // Clear invalid data
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            document.cookie = "token=; path=/; max-age=0";
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-logout after 15 minutes of inactivity
    useEffect(() => {
        if (!user || !token) return;

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

    const login = (newToken: string, userData: User) => {
        setToken(newToken);
        setUser(userData);
        localStorage.setItem("token", newToken);
        localStorage.setItem("user", JSON.stringify(userData));
        // Set cookie for middleware
        document.cookie = `token=${newToken}; path=/`;
    };

    const logout = async () => {
        try {
            // Call server to clear HttpOnly cookie
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (error) {
            console.error("Logout API error:", error);
        } finally {
            setToken(null);
            setUser(null);
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Also try to clear client-side cookie just in case
            document.cookie = "token=; path=/; max-age=0";
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
        isAuthenticated: !!user && !!token,
        token,
        isLoading,
        hasRole,
        isAdmin,
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
