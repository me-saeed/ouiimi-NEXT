"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signinSchema, type SigninInput } from "@/lib/validation";
import { Button } from "@/components/ui/button";
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

      // Redirect to home or dashboard
      setTimeout(() => {
        router.push("/");
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
    <div className="min-h-screen bg-color-bg p-4">
      <div className="max-w-md mx-auto">
        <form className="w-full relative mt-20" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-3">
            <div>
              <div className="text-xl antialiased font-bold items-center mb-4">
                Sign In
              </div>

              <div className="mt-4">
                <label
                  className="block uppercase text-gray-700 text-xs font-bold mb-2"
                  htmlFor="username"
                >
                  Email/ Username
                </label>
                <input
                  type="text"
                  className={`input-styl px-2 py-2 h-10 ${
                    errors.username ? "border-red-600" : ""
                  }`}
                  placeholder=" Email/ Username"
                  id="username"
                  {...register("username")}
                />
                {errors.username && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.username.message}
                  </div>
                )}
              </div>
            </div>

            <div>
              <div className="mt-2">
                <label
                  className="block uppercase text-gray-700 text-xs font-bold mb-2"
                  htmlFor="password"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  className={`input-styl px-2 py-2 h-10 ${
                    errors.password ? "border-red-600" : ""
                  }`}
                  placeholder="Password"
                  {...register("password")}
                />
                {errors.password && (
                  <div className="text-red-600 text-sm mt-1">
                    {errors.password.message}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="mt-2 mx-8">
                {isLoading ? (
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <button className="btn-styl" type="submit">
                    Sign In
                  </button>
                )}
              </div>

              <div className="mt-2 mx-8">
                <a className="btn-styl block text-center" href="/signup">
                  Sign up
                </a>
              </div>
            </div>

            <div className="mt-2 mx-8">
              <a className="text-red-600 text-sm" href="/forgetpass">
                Forget Password
              </a>
            </div>
          </div>
        </form>

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

        {/* Social Login Buttons */}
        <div className="mt-8">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-color-bg px-2 text-gray-500">
                Or continue with
              </span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              disabled={isLoading}
              className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="mr-2 h-5 w-5" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
