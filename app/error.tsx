"use client";

import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <PageLayout>
      <div className="bg-color-bg min-h-[60vh] flex items-center justify-center py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
            <h1 className="text-4xl font-bold text-color-primary mb-4">
              Something went wrong!
            </h1>
            <p className="text-color-gray mb-8">{error.message}</p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={reset}
                className="btn-styl btn-primary"
              >
                Try again
              </button>
              <Link href="/" className="btn-styl btn-outline">
                Go home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
