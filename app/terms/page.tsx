"use client";

import Link from "next/link";

export default function TermsPage() {
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
          <h1 className="text-4xl font-bold text-color-primary mb-2">TERMS & CONDITIONS</h1>
          <p className="text-sm text-color-gray mb-8">Last updated: 2025</p>

          <div className="prose prose-lg max-w-none space-y-6 text-color-gray">
            <p className="text-lg">
              ouiimi is operated by ouiiwe Pty Ltd (ABN 37 688 775 840). By using ouiimi, you agree to these Terms.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">1. ABOUT OUIIMI</h2>
              <p>ouiimi is a marketplace connecting customers with independent service providers ("Businesses").</p>
              <p className="mt-2">Businesses are fully responsible for delivering services. ouiimi facilitates bookings and payments only.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">2. ELIGIBILITY</h2>
              <p>Users must be 18+. Businesses must comply with legal, licensing, and regulatory requirements.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">3. ACCOUNT CREATION</h2>
              <p>Users and Businesses must provide accurate information and keep login details secure.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">4. MARKETPLACE RELATIONSHIP</h2>
              <p>ouiimi does not provide services and is not responsible for service quality, safety, legality, or outcomes.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">5. BOOKINGS & PAYMENTS</h2>
              <p>Users pay a 10% deposit + $1.99 service fee. Remaining balance is paid directly to the Business. Payments processed via Stripe.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">6. CANCELLATIONS & REFUNDS</h2>
              <p className="mb-2"><strong>User cancellation:</strong> Business receives 50% of deposit. Service fee non-refundable.</p>
              <p><strong>Business cancellation:</strong> User receives full 10% deposit refund (service fee non-refundable).</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">7. BUSINESS RESPONSIBILITIES</h2>
              <p>Businesses must deliver services safely, professionally, and legally.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">8. USER RESPONSIBILITIES</h2>
              <p>Users must attend appointments on time and behave respectfully.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">9. PROHIBITED CONDUCT</h2>
              <p>No fraud, misuse, harassment, or bypassing ouiimi to avoid fees.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">10. SUSPENSION</h2>
              <p>Accounts may be suspended or removed for breach of Terms.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">11. LIABILITY</h2>
              <p>ouiimi is not liable for service delivery, disputes, damages, loss, or injury caused by Businesses.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">12. INTERNATIONAL BUSINESS OWNERS</h2>
              <p>Must comply with local laws and ouiimi requirements.</p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">13. PRIVACY</h2>
              <p>
                See <Link href="/privacy" className="text-color-primary hover:underline">Privacy Policy</Link>.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-bold text-color-primary mb-4">14. CONTACT</h2>
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

