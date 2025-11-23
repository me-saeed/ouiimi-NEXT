import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="bg-color-bg py-12 sm:py-16">
        <div className="container">
          <div className="mx-auto max-w-4xl">
            <div className="bg-white rounded-xl shadow-md p-8 md:p-12">
              <h1 className="text-4xl font-bold text-color-primary mb-8">About Us</h1>

              <div className="prose prose-lg max-w-none space-y-8 text-color-gray">
                <p className="text-lg leading-relaxed">
                  At ouiimi, we believe booking your everyday services should be simple, fast, and stress-free.
                  No more juggling multiple apps, endless DMs, messy spreadsheets, or searching for availability across different pages.
                  Just one clean, modern platform where you can discover, book, and manage all your essential services - effortlessly.
                </p>
                <p className="text-lg leading-relaxed">
                  From haircuts and nails to massage, beauty, dog grooming and more, ouiimi brings your favourite local businesses together in one place. Designed with simplicity at its core, ouiimi makes it easier for customers to find quality services, and easier for businesses to focus on what they do best.
                </p>

                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-color-primary mb-4">For Customers</h2>
                  <p className="text-lg mb-4">Life is busy - booking shouldn&apos;t be.</p>
                  <p className="mb-4">ouiimi gives you:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>A single home for all your everyday services</li>
                    <li>Verified, high-quality providers</li>
                    <li>Clear pricing and easy-to-understand services</li>
                    <li>A secure 10% deposit that protects your booking</li>
                    <li>Pay the remaining 90% during/after your booking directly to the business.</li>
                    <li>A modern, intuitive experience designed for your life style</li>
                  </ul>
                  <p className="mt-4">
                    Whether you want a fresh haircut, a relaxing massage, a quick manicure, or your dog groomed - ouiimi helps you book it in minutes.
                  </p>
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-color-primary mb-4">For Businesses</h2>
                  <p className="text-lg mb-4">
                    We know how hard it is to run a service business today. No-shows. Admin overload. Unpredictable income, spending hours replying to messages. Platforms that charge high fees but bring you no customers. ouiimi fixes this.
                  </p>
                  <p className="mb-4">Businesses get:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>A digital storefront in a growing marketplace</li>
                    <li>New customer discovery (not just bookings from your existing clients)</li>
                    <li>A reliable 10% deposit system to reduce no-shows</li>
                    <li>Easy service listings, availability management, and payouts</li>
                    <li>A clean, professional presence without paying for complicated software</li>
                  </ul>
                  <p className="mt-4">We&apos;re here to help you grow, not overwhelm you.</p>
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-color-primary mb-4">Our Mission</h2>
                  <p className="text-lg mb-4">
                    To bring the everyday services industry into the relatable modern world - with tools that are simple, fair, and built for people.
                  </p>
                  <p className="mb-4">We&apos;re building a community where:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>customers feel confident</li>
                    <li>businesses feel supported</li>
                    <li>and booking feels effortless</li>
                  </ul>
                  <p className="mt-4 text-lg font-semibold">
                    ouiimi is more than a booking platform.
                  </p>
                  <p className="text-lg font-semibold">
                    It&apos;s a smarter way to manage your everyday life.
                  </p>
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-color-primary mb-4">Our Promise</h2>
                  <ul className="list-none space-y-2">
                    <li className="text-lg font-semibold">Simplicity.</li>
                    <li className="text-lg font-semibold">Transparency.</li>
                    <li className="text-lg font-semibold">Community.</li>
                    <li className="text-lg font-semibold">Fairness.</li>
                  </ul>
                  <p className="mt-4">
                    These aren&apos;t slogans - they&apos;re the foundations ouiimi is built on.
                  </p>
                </section>

                <section className="mt-10">
                  <h2 className="text-2xl font-bold text-color-primary mb-4">The Meaning Behind the Name</h2>
                  <p className="text-lg leading-relaxed">
                    Inspired by the spirit of &quot;yes&quot; - oui - and the personal connection of &quot;me,&quot; ouiimi represents a future where booking is not only simple, but tailored for you.
                    It&apos;s a name that feels welcoming, positive, and modern - just like the platform itself.
                  </p>
                </section>

                <div className="mt-12 pt-8 border-t">
                  <p className="text-2xl font-bold text-color-primary text-center">
                    Welcome to ouiimi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
