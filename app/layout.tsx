import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Providers } from "@/lib/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ouiimi - Simple Booking for Everyday Services",
  description: "Discover, book, and manage all your everyday services - from haircuts to dog grooming. Simple, fast, and stress-free booking platform.",
  keywords: "booking, services, haircuts, beauty, massage, dog grooming, appointments",
  authors: [{ name: "ouiimi" }],
  openGraph: {
    title: "ouiimi - Simple Booking for Everyday Services",
    description: "Discover, book, and manage all your everyday services in one place.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {googleMapsApiKey && (
          <Script
            src={`https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places`}
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}

