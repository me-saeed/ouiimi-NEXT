import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function NotFound() {
  return (
    <PageLayout>
      <div className="bg-color-bg min-h-[60vh] flex items-center justify-center py-12">
        <div className="container max-w-2xl text-center">
          <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
            <h1 className="text-6xl font-bold text-color-primary mb-4">404</h1>
            <h2 className="text-2xl font-semibold text-color-black mb-4">
              Page not found
            </h2>
            <p className="text-color-gray mb-8">
              The page you&apos;re looking for doesn&apos;t exist or has been moved.
            </p>
            <Link href="/" className="btn-styl btn-primary">
              Go back home
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
