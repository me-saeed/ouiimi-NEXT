"use client";

import PageLayout from "@/components/layout/PageLayout";

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="bg-white min-h-screen py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-4xl">

          {/* Main Title */}
          <div className="text-center mb-16 space-y-6">
            <h1 className="text-4xl font-bold text-[#3A3A3A] uppercase tracking-wide">About Us</h1>

            <div className="space-y-4 text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
              <p>
                At ouiimi, we believe booking your everyday services should be simple, fast, and stress-free.
              </p>
              <p>
                No more juggling multiple apps, endless DMs, messy spreadsheets, or searching for availability across different pages.
              </p>
              <p>
                Just one clean, modern platform where you can discover, book, and manage all your essential services — effortlessly.
              </p>
              <p>
                From haircuts and nails to massage, beauty, dog grooming and more, ouiimi brings your favourite local businesses together in one place. Designed with simplicity at its core, ouiimi makes it easier for customers to find quality services, and easier for businesses to focus on what they do best.
              </p>
            </div>
          </div>

          <div className="space-y-20">
            {/* For Customers */}
            <section className="text-center">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-8">For Customers</h2>
              <div className="text-lg text-gray-600 max-w-3xl mx-auto space-y-6">
                <p className="font-medium italic">Life is busy — booking shouldn&apos;t be.</p>
                <p>ouiimi gives you:</p>
                <ul className="space-y-3 list-none">
                  <li>• A single home for all your everyday services</li>
                  <li>• Verified, high-quality providers</li>
                  <li>• Clear pricing and easy-to-understand services</li>
                  <li>• A secure 10% deposit that protects your booking</li>
                  <li>• Pay the remaining 90% during/after your booking directly to the business.</li>
                  <li>• A modern, intuitive experience designed for your life style</li>
                </ul>
                <p className="pt-4">
                  Whether you want a fresh haircut, a relaxing massage, a quick manicure, or your dog groomed — ouiimi helps you book it in minutes.
                </p>
              </div>
            </section>

            {/* For Businesses */}
            <section className="text-center">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-8">For Businesses</h2>
              <div className="text-lg text-gray-600 max-w-3xl mx-auto space-y-6">
                <p>
                  We know how hard it is to run a service business today. No-shows. Admin overload. Unpredictable income, spending hours replying to messages. Platforms that charge high fees but bring you no customers. ouiimi fixes this.
                </p>
                <p>Businesses get:</p>
                <ul className="space-y-3 list-none">
                  <li>• A digital storefront in a growing marketplace</li>
                  <li>• New customer discovery (not just bookings from your existing clients)</li>
                  <li>• A reliable 10% deposit system to reduce no-shows</li>
                  <li>• Easy service listings, availability management, and payouts</li>
                  <li>• A clean, professional presence without paying for complicated software</li>
                </ul>
                <p className="pt-4 font-medium italic">
                  We&apos;re here to help you grow, not overwhelm you.
                </p>
              </div>
            </section>

            {/* Our Mission */}
            <section className="text-center">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-8">Our Mission</h2>
              <div className="text-lg text-gray-600 max-w-3xl mx-auto space-y-6">
                <p>
                  To bring the everyday services industry into the relatable modern world — with tools that are simple, fair, and built for people.
                </p>
                <div className="font-medium space-y-2">
                  <p>We&apos;re building a community where:</p>
                  <p>• customers feel confident</p>
                  <p>• businesses feel supported</p>
                  <p>• and booking feels effortless</p>
                </div>
                <p className="pt-4">
                  ouiimi is more than a booking platform.<br />
                  It&apos;s a smarter way to manage your everyday life.
                </p>
              </div>
            </section>

            {/* Our Promise */}
            <section className="text-center">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-8">Our Promise</h2>
              <div className="text-xl text-[#3A3A3A] font-bold space-y-2 mb-6 uppercase tracking-wider">
                <p>Simplicity.</p>
                <p>Transparency.</p>
                <p>Community.</p>
                <p>Fairness.</p>
              </div>
              <p className="text-lg text-gray-600 italic">
                These aren&apos;t slogans — they&apos;re the foundations ouiimi is built on.
              </p>
            </section>

            {/* Meaning Behind Name */}
            <section className="text-center bg-gray-50 rounded-3xl p-10">
              <h2 className="text-3xl font-bold text-[#3A3A3A] mb-6">The Meaning Behind the Name</h2>
              <div className="text-lg text-gray-600 max-w-3xl mx-auto space-y-4">
                <p>
                  Inspired by the spirit of &quot;yes&quot; — <span className="font-bold text-[#3A3A3A]">oui</span> — and the personal connection of &quot;<span className="font-bold text-[#3A3A3A]">me</span>,&quot; ouiimi represents a future where booking is not only simple, but tailored for you.
                </p>
                <p>
                  It&apos;s a name that feels welcoming, positive, and modern — just like the platform itself.
                </p>
              </div>
            </section>

            <div className="text-center pt-8">
              <h2 className="text-4xl font-bold text-[#3A3A3A]">Welcome to ouiimi.</h2>
            </div>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
