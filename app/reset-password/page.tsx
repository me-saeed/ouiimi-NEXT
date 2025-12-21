"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordFormSchema, type ResetPasswordFormInput } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import PageLayout from "@/components/layout/PageLayout";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    const tokenParam = searchParams.get("token");

    if (!emailParam || !tokenParam) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setEmail(emailParam);
    setToken(tokenParam);
  }, [searchParams]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    mode: "onChange",
  });

  const onSubmit = async (data: ResetPasswordFormInput) => {
    if (!email || !token) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          password: data.password,
          confirmPassword: data.confirmPassword,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = result.error || result.message || "Failed to reset password. Please try again.";
        setError(errorMsg);
        setIsLoading(false);
        return;
      }

      setSuccess("Password has been updated successfully! Redirecting to sign in...");
      setIsLoading(false);

      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <PageLayout>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <Alert variant="destructive">
                <AlertDescription>
                  Invalid reset link. Please request a new password reset.
                </AlertDescription>
              </Alert>
              <div className="mt-4 text-center">
                <Link
                  href="/forgetpass"
                  className="text-[#3A3A3A] text-sm underline hover:text-[#888888] transition-colors"
                >
                  Request Password Reset
                </Link>
              </div>
            </div>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h1 className="text-2xl font-bold text-[#3A3A3A] mb-2">Reset Password</h1>
            <p className="text-[#888888] text-sm mb-6">
              Enter your new password below.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Password Field */}
              <div>
                <label
                  className="block text-sm font-medium text-[#3A3A3A] mb-2"
                  htmlFor="password"
                >
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.password ? "border-red-500" : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent transition-all pr-12`}
                    placeholder="Enter new password"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label
                  className="block text-sm font-medium text-[#3A3A3A] mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    className={`w-full px-4 py-3 rounded-lg border ${errors.confirmPassword ? "border-red-500" : "border-gray-200"
                      } focus:outline-none focus:ring-2 focus:ring-[#EECFD1] focus:border-transparent transition-all pr-12`}
                    placeholder="Confirm new password"
                    {...register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
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
                    Resetting...
                  </span>
                ) : (
                  "Reset Password"
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EECFD1]"></div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
