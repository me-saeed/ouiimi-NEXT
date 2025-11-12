"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validation";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
    <div className="min-h-screen bg-color-bg p-4">
      <div className="max-w-md mx-auto">
        <form className="w-full relative mt-20" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <div>
              <div className="text-xl antialiased font-bold items-center mb-4">
                Forget Password
              </div>

              <div className="mt-4">
                <label
                  className="block uppercase text-gray-700 text-xs font-bold mb-2"
                  htmlFor="email"
                >
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  className={`input-styl px-2 py-2 h-10 ${
                    errors.email ? "border-red-600" : ""
                  }`}
                  placeholder="Enter your email"
                  {...register("email")}
                />
                {errors.email && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.email.message}
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
                  Send Reset Link
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

