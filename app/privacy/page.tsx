import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-color-bg">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center">
              <h1 className="text-2xl font-bold text-color-primary">Ouiimi</h1>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="btn-styl">
                Home
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-md p-8 md:p-12">
          <h1 className="text-4xl font-bold text-color-primary mb-2">PRIVACY POLICY</h1>
          <p className="text-sm text-color-gray mb-8">Last updated: 2025</p>

          <div className="prose prose-lg max-w-none space-y-6 text-color-gray">
            <p className="text-lg">
              ouiimi is operated by ouiiwe Pty Ltd (ABN 37 688 775 840).
            </p>
            <p className="text-lg">
              This policy explains how we collect and protect personal information.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">1. INFORMATION WE COLLECT</h2>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Name, email, password.</li>
                <li>Booking details.</li>
                <li>Payment processing via Stripe (no full card storage).</li>
                <li>Business details for Business owners.</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">2. NO COOKIES</h2>
              <p>ouiimi does not use cookies or tracking pixels.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">3. HOW INFORMATION IS USED</h2>
              <p>To create accounts, process bookings, notify Businesses, and maintain platform safety.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">4. SHARING INFORMATION</h2>
              <p className="mb-2">Shared only with:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Businesses (confirmed bookings)</li>
                <li>Stripe (payments)</li>
                <li>Legal authorities when required</li>
              </ul>
              <p className="mt-4 font-semibold">We never sell personal data.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">5. DATA STORAGE & SECURITY</h2>
              <p>Encrypted systems, secure servers, PCI-compliant payment processing.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">6. INTERNATIONAL USERS</h2>
              <p>Data may be stored in Australia or secure cloud regions.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">7. USER RIGHTS</h2>
              <p>Users may request data access, correction, or deletion.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">8. CHILDREN</h2>
              <p>Not intended for individuals under 18.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">9. POLICY UPDATES</h2>
              <p>Continued use means acceptance of future updates.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">10. CONTACT</h2>
              <p>
                <a href="mailto:information@ouiimi.com" className="text-color-primary hover:underline">
                  information@ouiimi.com
                </a>
              </p>
              <p>
                <a href="tel:0466006171" className="text-color-primary hover:underline">
                  0466 006 171
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="bg-white border-t mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-color-gray">&copy; 2024 Ouiimi. All rights reserved.</p>
            <div className="flex space-x-6">
              <Link href="/about" className="text-color-gray hover:text-color-primary">
                About
              </Link>
              <Link href="/privacy" className="text-color-gray hover:text-color-primary">
                Privacy
              </Link>
              <Link href="/terms" className="text-color-gray hover:text-color-primary">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

