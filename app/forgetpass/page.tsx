"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";

export default function ForgetPasswordPage() {
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to send reset email. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess(
        result.message ||
        "If an account with that email exists, a password reset link has been sent."
      );
      setIsLoading(false);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <PageLayout>
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#3A3A3A] mb-2">Forgot Password</h1>
            <p className="text-[#888888] text-sm mb-6">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label
                  className="block text-sm font-medium text-[#3A3A3A] mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-red-500" : "border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent transition-all`}
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert variant="success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-[#EECFD1] hover:bg-[#e5c3c5] text-[#3A3A3A] font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#3A3A3A]"></span>
                    Sending...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <div className="text-center">
                <Link
                  href="/signin"
                  className="text-[#3A3A3A] text-sm underline hover:text-[#888888] transition-colors"
                >
                  Back to Sign In
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
