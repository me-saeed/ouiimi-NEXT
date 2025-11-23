import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-color-primary">ouiimi</h3>
            <p className="text-sm text-color-gray">
              Simple, fast, and stress-free booking for everyday services.
            </p>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-color-black">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/about"
                  className="text-color-gray hover:text-color-primary transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-color-gray hover:text-color-primary transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-color-gray hover:text-color-primary transition-colors"
                >
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-color-black">Support</h4>
            <ul className="space-y-2 text-sm text-color-gray">
              <li>
                <a
                  href="mailto:information@ouiimi.com"
                  className="hover:text-color-primary transition-colors"
                >
                  information@ouiimi.com
                </a>
              </li>
              <li>
                <a
                  href="tel:0466006171"
                  className="hover:text-color-primary transition-colors"
                >
                  0466 006 171
                </a>
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-color-black">Connect</h4>
            <p className="text-sm text-color-gray">
              Follow us for updates and news
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t text-center text-sm text-color-gray">
          <p>&copy; {new Date().getFullYear()} ouiimi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

