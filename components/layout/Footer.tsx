import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-6">
          <p className="text-[#3A3A3A] font-semibold text-lg">
            Bringing authenticity back to shopping.
          </p>
          <div className="space-y-2">
            <p className="text-sm text-[#3A3A3A]/70">
              Contact: <a href="mailto:ouiimi@outlook.com" className="text-[#3A3A3A] hover:text-black transition-colors font-medium">ouiimi@outlook.com</a>
            </p>
            <p className="text-sm text-[#3A3A3A]/70">
              ABN: <span className="text-[#3A3A3A] font-medium">35903724003</span>
            </p>
          </div>
          <div className="flex items-center justify-center space-x-8 pt-6 border-t border-gray-200">
            <Link
              href="/privacy"
              className="text-sm text-[#3A3A3A]/70 hover:text-[#3A3A3A] transition-colors font-medium"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-[#3A3A3A]/70 hover:text-[#3A3A3A] transition-colors font-medium"
            >
              Terms & conditions
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm text-[#3A3A3A]/70 hover:text-[#3A3A3A] transition-colors font-medium"
            >
              How It Works
            </Link>
          </div>
          <p className="text-xs text-[#3A3A3A]/50 pt-4">
            &copy; {new Date().getFullYear()} ouiimi. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
