"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signIn } from "next-auth/react";

export default function SigninPage() {
  const router = useRouter();
  // CSRF token temporarily disabled
  // const [csrfToken, setCsrfToken] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
  });

  // CSRF token fetching temporarily disabled
  // useEffect(() => {
  //   // Fetch CSRF token
  //   fetch("/api/auth/csrf")
  //     .then((res) => {
  //       if (!res.ok) {
  //         throw new Error(`CSRF fetch failed: ${res.status}`);
  //       }
  //       return res.json();
  //     })
  //     .then((data) => {
  //       if (data.csrfToken) {
  //         setCsrfToken(data.csrfToken);
  //         console.log("CSRF token loaded successfully");
  //       } else {
  //         console.error("CSRF token not in response:", data);
  //       }
  //     })
  //     .catch((err) => {
  //       console.error("Failed to fetch CSRF token:", err);
  //       setError("Failed to load security token. Please refresh the page.");
  //     });
  // }, []);

  const onSubmit = async (data: SigninInput) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // CSRF token temporarily disabled
          // "x-csrf-token": csrfToken,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Sign in failed. Please try again.");
        setIsLoading(false);
        return;
      }

      setSuccess("Successfully signed in! Redirecting...");

      // Store token and user data
      if (result.user?.token) {
        localStorage.setItem("token", result.user.token);
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      // Redirect to redirect url or home
      const searchParams = new URL(window.location.href).searchParams;
      const redirectUrl = searchParams.get("redirect") || "/";

      setTimeout(() => {
        router.push(redirectUrl);
      }, 1000);
    } catch (err: any) {
      setError("Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook") => {
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn(provider, {
        redirect: true,
        callbackUrl: "/",
      });
    } catch (err: any) {
      setError(`Failed to authenticate with ${provider}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-[#3A3A3A] mb-2">Sign In</h1>
          <p className="text-sm text-[#888888]">Welcome back to ouiimi</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label
              className="block text-sm font-medium text-[#3A3A3A] mb-2"
              htmlFor="username"
            >
              Email / Username
            </label>
            <Input
              type="text"
              id="username"
              placeholder="Enter your email or username"
              className={errors.username ? "border-red-500 focus-visible:ring-red-500" : ""}
              {...register("username")}
            />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1.5">{errors.username.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="block text-sm font-medium text-[#3A3A3A]"
                htmlFor="password"
              >
                Password
              </label>
              <a
                href="/forgetpass"
                className="text-sm text-[#EECFD1] hover:text-[#e5c4c7] transition-colors"
              >
                Forgot?
              </a>
            </div>
            <Input
              type="password"
              id="password"
              placeholder="Enter your password"
              className={errors.password ? "border-red-500 focus-visible:ring-red-500" : ""}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1.5">{errors.password.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="bg-green-50 border-green-200 text-green-800">
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            variant="pink"
            className="w-full h-12 text-base font-medium"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              </div>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-[#888888]">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-[#EECFD1] hover:text-[#e5c4c7] font-medium transition-colors">
              Sign up
            </a>
          </p>
        </div>

        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E5E5E5]"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-4 text-[#888888]">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
              className="w-full h-11 border-[#E5E5E5] hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOAuth("facebook")}
              disabled={isLoading}
              className="w-full h-11 border-[#E5E5E5] hover:bg-gray-50"
            >
              <svg className="mr-2 h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
