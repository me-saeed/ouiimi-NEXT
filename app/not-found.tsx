import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-color-bg flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-color-primary mb-4">404</h1>
        <p className="text-color-gray mb-8">Page not found</p>
        <Link href="/" className="btn-styl">
          Go back home
        </Link>
      </div>
    </div>
  );
}

