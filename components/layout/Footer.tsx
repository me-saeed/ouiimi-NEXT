import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[#F5F5F5] bg-white mt-auto">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand Section */}
          <div className="text-center md:text-left">
            <h3 className="text-2xl font-bold text-[#EECFD1] mb-3">ouiimi</h3>
            <p className="text-sm text-[#888888] leading-relaxed">
              Bringing authenticity back to shopping.
            </p>
          </div>

          {/* Quick Links */}
          <div className="text-center">
            <h4 className="text-sm font-bold text-[#3A3A3A] mb-4 uppercase tracking-wide">Quick Links</h4>
            <div className="flex flex-col space-y-2">
              <Link
                href="/privacy"
                className="text-sm text-[#888888] hover:text-[#EECFD1] transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-sm text-[#888888] hover:text-[#EECFD1] transition-colors"
              >
                Terms & Conditions
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm text-[#888888] hover:text-[#EECFD1] transition-colors"
              >
                How It Works
              </Link>
            </div>
          </div>

          {/* Contact Info */}
          <div className="text-center md:text-right">
            <h4 className="text-sm font-bold text-[#3A3A3A] mb-4 uppercase tracking-wide">Contact</h4>
            <div className="space-y-2">
              <p className="text-sm text-[#888888]">
                <a href="mailto:ouiimi@outlook.com" className="hover:text-[#EECFD1] transition-colors">
                  ouiimi@outlook.com
                </a>
              </p>
              <p className="text-sm text-[#888888]">
                ABN: <span className="text-[#3A3A3A] font-medium">35903724003</span>
              </p>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-6 border-t border-[#F5F5F5] text-center">
          <p className="text-xs text-[#888888]">
            &copy; {new Date().getFullYear()} ouiimi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
