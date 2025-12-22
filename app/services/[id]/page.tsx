import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceBookingForm } from "@/components/services/ServiceBookingForm";
import { notFound } from "next/navigation";

// Enable ISR - revalidate every 30 seconds (more frequent for detail pages)
export const revalidate = 30;

interface PageProps {
  params: {
    id: string;
  };
}

// Server-side service data fetching
async function fetchService(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/services/${id}`, {
      next: { revalidate: 30 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Service Detail Server] API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.service;
  } catch (error) {
    console.error('[Service Detail Server] Error fetching service:', error);
    return null;
  }
}

// Server-side business data fetching
async function fetchBusiness(businessId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${baseUrl}/api/business/${businessId}`, {
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('[Service Detail Server] Business API error:', response.status);
      return null;
    }

    const data = await response.json();
    return data.business;
  } catch (error) {
    console.error('[Service Detail Server] Error fetching business:', error);
    return null;
  }
}

// Main Server Component
export default async function ServiceDetailPage({ params }: PageProps) {
  // Fetch service data server-side
  const service = await fetchService(params.id);

  // Return 404 if service not found
  if (!service) {
    notFound();
  }

  // Fetch business data if needed
  let business = null;
  if (service.businessId) {
    if (typeof service.businessId === 'object' && service.businessId.businessName) {
      // Already populated
      business = service.businessId;
    } else {
      // Fetch business separately
      const businessId = typeof service.businessId === 'object'
        ? service.businessId._id || service.businessId.id
        : service.businessId;

      if (businessId) {
        business = await fetchBusiness(businessId);
      }
    }
  }

  return (
    <PageLayout>
      <div className="bg-white min-h-screen py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          {/* Booking Card - Modern Professional Design */}
          <div className="bg-white rounded-2xl shadow-xl border-0 overflow-hidden">
            {/* Booking Form - Client Component */}
            <div className="p-8">
              <ServiceBookingForm service={service} business={business} />
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

// Generate 404 page
export function generateMetadata({ params }: PageProps) {
  return {
    title: `Service Details | ouiimi`,
    description: `Book your service on ouiimi`,
  };
}
