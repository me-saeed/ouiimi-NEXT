"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

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
