"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Modal } from "@/components/ui/modal";
import { Eye, EyeOff, Lock, Building2 } from "lucide-react";
import { useAuth } from "@/lib/contexts/AuthContext";

interface BusinessAuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    redirectTo?: string;
}

export function BusinessAuthModal({
    isOpen,
    onClose,
    onSuccess,
    redirectTo = "/business/dashboard",
}: BusinessAuthModalProps) {
    const router = useRouter();
    const { refreshSession } = useAuth();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/auth/business-session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                setError(result.error || "Authentication failed. Please try again.");
                setIsLoading(false);
                return;
            }

            // Success - show success state briefly then redirect
            setIsSuccess(true);
            onSuccess?.();

            // Small delay for visual feedback, then smooth navigation
            setTimeout(() => {
                router.push(redirectTo);
            }, 300);

        } catch (err) {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        if (isLoading || isSuccess) return; // Prevent closing during auth
        setUsername("");
        setPassword("");
        setError("");
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title=""
            maxWidth="max-w-md"
        >
            <div className="space-y-6">
                {/* Header */}
                <div className="text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center transition-all duration-300 ${isSuccess ? 'bg-green-100' : 'bg-[#EECFD1]/20'
                        }`}>
                        {isSuccess ? (
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <Building2 className="w-8 h-8 text-[#EECFD1]" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold text-[#3A3A3A]">
                        {isSuccess ? 'Access Granted' : 'Business Access'}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2">
                        {isSuccess
                            ? 'Redirecting to dashboard...'
                            : 'Please confirm your credentials to access the business dashboard'}
                    </p>
                </div>

                {/* Form - hide when success */}
                {!isSuccess && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label
                                className="block text-sm font-medium text-[#3A3A3A] mb-2"
                                htmlFor="business-username"
                            >
                                Email / Username
                            </label>
                            <Input
                                type="text"
                                id="business-username"
                                placeholder="Enter your email or username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={isLoading}
                                required
                                autoFocus
                            />
                        </div>

                        <div>
                            <label
                                className="block text-sm font-medium text-[#3A3A3A] mb-2"
                                htmlFor="business-password"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? "text" : "password"}
                                    id="business-password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={isLoading}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                disabled={isLoading}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="pink"
                                disabled={isLoading || !username || !password}
                                className="flex-1"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                        Verifying...
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2">
                                        <Lock className="w-4 h-4" />
                                        Confirm Access
                                    </div>
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {/* Info */}
                {!isSuccess && (
                    <p className="text-xs text-center text-gray-400">
                        For your security, we require re-authentication to access the business dashboard.
                    </p>
                )}
            </div>
        </Modal>
    );
}
