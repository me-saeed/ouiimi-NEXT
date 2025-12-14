"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
    isOpen: boolean;
    onClose?: () => void;
    message?: string;
    redirectPath?: string;
    dismissible?: boolean;
}

export function AuthModal({
    isOpen,
    onClose,
    message = "Please sign in to continue",
    redirectPath,
    dismissible = true,
}: AuthModalProps) {
    const router = useRouter();

    if (!isOpen) return null;

    const handleSignIn = () => {
        const redirect = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : "";
        router.push(`/signin${redirect}`);
    };

    const handleSignUp = () => {
        const redirect = redirectPath ? `?redirect=${encodeURIComponent(redirectPath)}` : "";
        router.push(`/signup${redirect}`);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={dismissible ? onClose : undefined}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
                {/* Close button */}
                {dismissible && onClose && (
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
                        aria-label="Close"
                    >
                        <svg
                            className="w-5 h-5"
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
                )}

                {/* Content */}
                <div className="p-8 text-center">
                    {/* Icon */}
                    <div className="mx-auto w-16 h-16 bg-[#EECFD1]/20 rounded-full flex items-center justify-center mb-6">
                        <svg
                            className="w-8 h-8 text-[#EECFD1]"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                    </div>

                    {/* Message */}
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Authentication Required
                    </h2>
                    <p className="text-gray-600 mb-8 leading-relaxed">{message}</p>

                    {/* Buttons */}
                    <div className="space-y-3">
                        <Button
                            onClick={handleSignIn}
                            className="w-full h-12 text-base font-semibold bg-[#EECFD1] hover:bg-[#e5c4c7] text-white shadow-md transition-all duration-200"
                        >
                            Sign In
                        </Button>
                        <Button
                            onClick={handleSignUp}
                            variant="outline"
                            className="w-full h-12 text-base font-semibold border-2 border-[#EECFD1] text-[#EECFD1] hover:bg-[#EECFD1]/10 transition-all duration-200"
                        >
                            Create New Account
                        </Button>
                    </div>

                    {/* Note */}
                    <p className="text-xs text-gray-500 mt-6">
                        You need to be signed in to access this feature
                    </p>
                </div>
            </div>
        </div>
    );
}
