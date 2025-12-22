import PageLayout from "@/components/layout/PageLayout";
import { BusinessTabs } from "@/components/business/BusinessTabs";
import { notFound } from "next/navigation";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: {
    id: string;
  };
}

// Server-side business data fetching
async function fetchBusinessData(businessId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

    const [businessRes, servicesRes, staffRes] = await Promise.all([
      fetch(`${baseUrl}/api/business/${businessId}`, {
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/api/services?businessId=${businessId}&status=listed`, {
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`${baseUrl}/api/staff?businessId=${businessId}`, {
        next: { revalidate: 60 },
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    const business = businessRes.ok ? (await businessRes.json()).business : null;
    const services = servicesRes.ok ? (await servicesRes.json()).services || [] : [];
    const staff = staffRes.ok ? (await staffRes.json()).staff || [] : [];

    return { business, services, staff };
  } catch (error) {
    console.error('[Business Profile Server] Error fetching data:', error);
    return { business: null, services: [], staff: [] };
  }
}

// Main Server Component
export default async function BusinessProfilePage({ params }: PageProps) {
  const { business, services, staff } = await fetchBusinessData(params.id);

  if (!business) {
    notFound();
  }

  return (
    <PageLayout>
      <div className="bg-background min-h-screen">
        {/* Business Header */}
        <div className="bg-secondary/30 py-8">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center space-y-4">
              {business.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={business.logo}
                  alt={business.businessName}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-sm"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-sm flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">
                    {business.businessName?.charAt(0) || "B"}
                  </span>
                </div>
              )}

              <h2 className="text-xl font-medium text-foreground">{business.businessName}</h2>
            </div>
          </div>
        </div>

        {/* Business Tabs - Client Component for Interactivity */}
        <BusinessTabs business={business} services={services} staff={staff} />
      </div>
    </PageLayout>
  );
}

// Generate metadata
export function generateMetadata({ params }: PageProps) {
  return {
    title: `Business Profile | ouiimi`,
    description: `View business profile and services`,
  };
}
