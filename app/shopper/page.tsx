import PageLayout from "@/components/layout/PageLayout";

export default function ShopperPage() {
  return (
    <PageLayout>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-4">
              For Shoppers
            </h1>
            <p className="text-lg text-[#3A3A3A] mb-8">
              Discover and book services from local businesses
            </p>
            <div className="mt-8">
              <a
                href="/"
                className="inline-block bg-[#EECFD1] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#EECFD1]/90 transition-colors"
              >
                Browse Services
              </a>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

