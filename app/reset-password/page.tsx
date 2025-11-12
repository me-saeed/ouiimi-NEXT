"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState<string>("");
  const [token, setToken] = useState<string>("");

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
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordInput) => {
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
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Failed to reset password. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess("Password has been updated successfully! Redirecting to sign in...");

      // Redirect to signin after 2 seconds
      setTimeout(() => {
        router.push("/signin");
      }, 2000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (!email || !token) {
    return (
      <div className="min-h-screen bg-color-bg p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <Alert variant="destructive">
            <AlertDescription>
              Invalid reset link. Please request a new password reset.
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <a className="text-primary text-sm hover:underline" href="/forgetpass">
              Request Password Reset
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-color-bg p-4">
      <div className="max-w-md mx-auto">
        <form className="w-full relative mt-20" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <div>
              <div className="text-xl antialiased font-bold items-center mb-4">
                Reset Password
              </div>

              <div className="mt-4">
                <label
                  className="block uppercase text-gray-700 text-xs font-bold mb-2"
                  htmlFor="password"
                >
                  New Password
                </label>
                <input
                  type="password"
                  id="password"
                  className={`input-styl px-2 py-2 h-10 ${
                    errors.password ? "border-red-600" : ""
                  }`}
                  placeholder="Enter new password"
                  {...register("password")}
                />
                {errors.password && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.password.message}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mt-4">
                <label
                  className="block uppercase text-gray-700 text-xs font-bold mb-2"
                  htmlFor="confirmPassword"
                >
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className={`input-styl px-2 py-2 h-10 ${
                    errors.confirmPassword ? "border-red-600" : ""
                  }`}
                  placeholder="Confirm new password"
                  {...register("confirmPassword")}
                />
                {errors.confirmPassword && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.confirmPassword.message}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="mt-4">
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {success && (
              <div className="mt-4">
                <Alert variant="success">
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              </div>
            )}

            <div className="mt-4">
              {isLoading ? (
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <button className="btn-styl" type="submit">
                  Reset Password
                </button>
              )}
            </div>

            <div className="mt-4">
              <a className="text-primary text-sm hover:underline" href="/signin">
                Back to Sign In
              </a>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-color-bg p-4 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}

