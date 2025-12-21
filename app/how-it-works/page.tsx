"use client";

import PageLayout from "@/components/layout/PageLayout";

export default function HowItWorksPage() {
  return (
    <PageLayout>
      <div className="bg-white min-h-screen py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

          {/* Main Title */}
          <div className="text-center mb-16 space-y-4">
            <h1 className="text-4xl font-bold text-[#3A3A3A] truncate">How ouiimi works</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              ouiimi makes booking everyday services simple, reliable, and stress-free — for both
              customers and small businesses.
            </p>
          </div>

          {/* Booking Process (Customers) */}
          <section className="mb-20">
            <h2 className="text-2xl font-bold text-[#3A3A3A] text-center mb-12 truncate">
              Booking Process (For Customers)
            </h2>

            {/* Steps Timeline - visual representation */}
            <div className="flex flex-col md:flex-row justify-between items-center relative mb-12 max-w-2xl mx-auto">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-[14px] left-0 w-full h-0.5 bg-gray-200 -z-10"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10">
                <div className="w-8 h-8 rounded-full bg-[#EECFD1] flex items-center justify-center font-bold text-white mb-3">1</div>
                <span className="font-bold text-[#3A3A3A]">Browse</span>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10 md:mt-0 mt-4">
                <div className="w-8 h-8 rounded-full bg-[#EECFD1] flex items-center justify-center font-bold text-white mb-3">2</div>
                <span className="font-bold text-[#3A3A3A]">Check availability</span>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10 md:mt-0 mt-4">
                <div className="w-8 h-8 rounded-full bg-[#EECFD1] flex items-center justify-center font-bold text-white mb-3">3</div>
                <span className="font-bold text-[#3A3A3A]">Book</span>
              </div>
            </div>

            <div className="space-y-12 text-center max-w-3xl mx-auto">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Browse</h3>
                <p className="text-gray-600">
                  Discover trusted local services — hair, nails, beauty, massage, wellness, dog grooming, and more.<br />
                  Find what you need fast, without endless searching or Instagram DMs.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Check Availability</h3>
                <p className="text-gray-600">
                  Choose your preferred date and time instantly.<br />
                  Real-time availability means no waiting, no back-and-forth messages, and no uncertainty.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Book</h3>
                <p className="text-gray-600">
                  Secure your appointment with a 10% deposit + $1.99 service fee.<br />
                  Instant confirmation, stored safely in your ouiimi dashboard.<br />
                  Feel confident knowing exactly what you&apos;ve booked before you arrive.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">Why Customers Love It</h3>
              <p className="text-gray-600 italic">
                Everything is clear, secure, and organised — so you spend less time planning and more time enjoying your appointment.
              </p>
            </div>
          </section>

          {/* Business Process */}
          <section>
            <h2 className="text-2xl font-bold text-[#3A3A3A] text-center mb-12 truncate">
              3-Step Process (For Small Businesses)
            </h2>

            {/* Steps Timeline - visual representation */}
            <div className="flex flex-col md:flex-row justify-between items-center relative mb-12 max-w-3xl mx-auto">
              {/* Connector Line (Desktop) */}
              <div className="hidden md:block absolute top-[14px] left-0 w-full h-0.5 bg-gray-200 -z-10"></div>

              {/* Step 1 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10">
                <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center font-bold text-white mb-3">1</div>
                <span className="font-bold text-[#3A3A3A]">Register Your Business</span>
              </div>
              {/* Step 2 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10 md:mt-0 mt-4">
                <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center font-bold text-white mb-3">2</div>
                <span className="font-bold text-[#3A3A3A]">Set Your Availability</span>
              </div>
              {/* Step 3 */}
              <div className="flex flex-col items-center bg-white px-4 md:px-0 z-10 md:mt-0 mt-4">
                <div className="w-8 h-8 rounded-full bg-[#3A3A3A] flex items-center justify-center font-bold text-white mb-3">3</div>
                <span className="font-bold text-[#3A3A3A]">Get Booked</span>
              </div>
            </div>

            <div className="space-y-12 text-center max-w-3xl mx-auto">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Register Your Business</h3>
                <p className="text-gray-600">
                  Submit a quick application to join ouiimi.<br />
                  Once approved, your dashboard is activated — with no listing fees, no subscriptions, and no hidden charges.<br />
                  Your services, your pricing — ouiimi simply helps you get booked.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Set Your Availability</h3>
                <p className="text-gray-600 mb-4">Add your services in minutes:</p>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-gray-600 font-medium pb-2">
                  <span>• Prices</span>
                  <span>• Durations</span>
                  <span>• Descriptions</span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-gray-600 font-medium">
                  <span>• Add-ons</span>
                  <span>• Opening hours & availability</span>
                </div>
                <p className="text-gray-600 mt-4">
                  Your dashboard becomes your digital storefront — clean, professional, and easy to manage.
                </p>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-bold text-[#3A3A3A]">Get Booked</h3>
                <p className="text-gray-600">
                  Customers can now instantly book your available times. You receive:
                </p>
                <ul className="text-gray-600 list-none space-y-1">
                  <li>- Instant email notifications</li>
                  <li>- Bookings added to your calendar</li>
                  <li>- A secured percentage of each deposit every time</li>
                </ul>
                <p className="text-gray-600 pt-2">
                  Spend less time replying to messages and more time doing what you do best.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center bg-gray-50 p-6 rounded-2xl">
              <h3 className="text-lg font-bold text-[#3A3A3A] mb-2">Why Businesses Love It</h3>
              <p className="text-gray-600 italic">
                ouiimi brings you new customers, reduces admin, and helps you grow — without extra fees or complicated systems.
              </p>
            </div>
          </section>

        </div>
      </div>
    </PageLayout>
  );
}
