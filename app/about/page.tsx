import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="bg-color-bg py-12 sm:py-16">
        <div className="container">
          <div className="mx-auto max-w-5xl">
            <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
              {/* Title - Centered */}
              <h1 className="text-5xl font-bold text-color-primary mb-12 text-center">
                How ouiimi Works
              </h1>

              {/* Intro - Centered */}
              <div className="text-center mb-16">
                <p className="text-2xl leading-relaxed text-color-gray max-w-3xl mx-auto">
                  ouiimi makes booking everyday services simple, reliable, and stress-free — for both customers and small businesses.
                </p>
              </div>

              {/* Booking Process Section */}
              <section className="mb-20">
                <h2 className="text-4xl font-bold text-color-primary mb-12 text-center">
                  Booking Process (For Customers)
                </h2>

                {/* 3 Steps - Centered */}
                <div className="flex justify-center gap-8 mb-12 text-xl font-semibold text-color-primary flex-wrap">
                  <span>Browse</span>
                  <span>→</span>
                  <span>Check availability</span>
                  <span>→</span>
                  <span>Book</span>
                </div>

                {/* Step 1: Browse */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Browse</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Discover trusted local services — hair, nails, beauty, massage, wellness, dog grooming, and more.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray">
                      Find what you need fast, without endless searching or Instagram DMs.
                    </p>
                  </div>
                </div>

                {/* Step 2: Check Availability */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Check Availability</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Choose your preferred date and time instantly.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray">
                      Real-time availability means no waiting, no back-and-forth messages, and no uncertainty.
                    </p>
                  </div>
                </div>

                {/* Step 3: Book */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Book</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Secure your appointment with a 10% deposit + $1.99 service fee.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Instant confirmation, stored safely in your ouiimi dashboard.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray">
                      Feel confident knowing exactly what you've booked before you arrive.
                    </p>
                  </div>
                </div>

                {/* Why Customers Love It */}
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Why Customers Love It</h3>
                  <p className="text-xl leading-relaxed text-color-gray max-w-3xl mx-auto">
                    Everything is clear, secure, and organised — so you spend less time planning and more time enjoying your appointment.
                  </p>
                </div>
              </section>

              {/* Business Process Section */}
              <section className="mb-20">
                <h2 className="text-4xl font-bold text-color-primary mb-12 text-center">
                  3-Step Process (For Small Businesses)
                </h2>

                {/* 3 Steps - Centered */}
                <div className="flex justify-center gap-8 mb-12 text-xl font-semibold text-color-primary flex-wrap">
                  <span>Register Your Business</span>
                  <span>→</span>
                  <span>Set Your Availability</span>
                  <span>→</span>
                  <span>Get Booked</span>
                </div>

                {/* Step 1: Register */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Register Your Business</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Submit a quick application to join ouiimi.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray mb-3">
                      Once approved, your dashboard is activated — with no listing fees, no subscriptions, and no hidden charges.
                    </p>
                    <p className="text-xl leading-relaxed text-color-gray">
                      Your services, your pricing — ouiimi simply helps you get booked.
                    </p>
                  </div>
                </div>

                {/* Step 2: Set Availability */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Set Your Availability</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-4">
                      Add your services in minutes:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xl text-color-gray max-w-2xl mx-auto">
                      <div>• Prices</div>
                      <div>• Add-ons</div>
                      <div>• Durations</div>
                      <div>• Opening hours & availability</div>
                      <div>• Descriptions</div>
                      <div></div>
                    </div>
                    <p className="text-xl leading-relaxed text-color-gray mt-6">
                      Your dashboard becomes your digital storefront — clean, professional, and easy to manage.
                    </p>
                  </div>
                </div>

                {/* Step 3: Get Booked */}
                <div className="mb-12 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Get Booked</h3>
                  <div className="max-w-3xl mx-auto">
                    <p className="text-xl leading-relaxed text-color-gray mb-4">
                      Customers can now instantly book your available times. You receive:
                    </p>
                    <ul className="list-none space-y-2 text-xl text-color-gray">
                      <li>• Instant email notifications</li>
                      <li>• Bookings added to your calendar</li>
                      <li>• A secured percentage of each deposit every time</li>
                    </ul>
                    <p className="text-xl leading-relaxed text-color-gray mt-6">
                      Spend less time replying to messages and more time doing what you do best.
                    </p>
                  </div>
                </div>

                {/* Why Businesses Love It */}
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <h3 className="text-3xl font-bold text-color-primary mb-4">Why Businesses Love It</h3>
                  <p className="text-xl leading-relaxed text-color-gray max-w-3xl mx-auto">
                    ouiimi brings you new customers, reduces admin, and helps you grow — without extra fees or complicated systems.
                  </p>
                </div>
              </section>

              {/* Final Message */}
              <div className="mt-16 pt-8 border-t text-center">
                <p className="text-3xl font-bold text-color-primary">
                  Welcome to ouiimi.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
