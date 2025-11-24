import PageLayout from "@/components/layout/PageLayout";

export default function HowItWorksPage() {
  return (
    <PageLayout>
      <div className="bg-white min-h-screen py-12">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-[#3A3A3A] mb-8 text-center">
              How It Works
            </h1>

            <div className="space-y-8">
              <div className="bg-[#D9D9D9] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-[#3A3A3A] mb-4">
                  For Shoppers
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-[#3A3A3A]">
                  <li>Browse services by category</li>
                  <li>Select a service and choose a time slot</li>
                  <li>Pay 10% deposit + $1.99 service fee</li>
                  <li>Pay remaining 90% directly to the business</li>
                  <li>Enjoy your service!</li>
                </ol>
              </div>

              <div className="bg-[#D9D9D9] rounded-lg p-6">
                <h2 className="text-2xl font-semibold text-[#3A3A3A] mb-4">
                  For Businesses
                </h2>
                <ol className="list-decimal list-inside space-y-2 text-[#3A3A3A]">
                  <li>Register your business account</li>
                  <li>Add your staff members</li>
                  <li>List your services with time slots</li>
                  <li>Receive bookings and manage appointments</li>
                  <li>Get paid 50% of the deposit upfront</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

