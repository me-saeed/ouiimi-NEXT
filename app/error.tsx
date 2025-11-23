"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-color-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-color-primary mb-4">Something went wrong!</h1>
        <p className="text-color-gray mb-8">{error.message}</p>
        <button
          onClick={reset}
          className="btn-styl"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

