import PageLayout from "@/components/layout/PageLayout";
import { BusinessTabs } from "@/components/business/BusinessTabs";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Business from "@/lib/models/Business";
import Service from "@/lib/models/Service";
import Staff from "@/lib/models/Staff";
import mongoose from "mongoose";

// Enable ISR - revalidate every 60 seconds
export const revalidate = 60;

interface PageProps {
  params: {
    id: string;
  };
}

// Server-side business data fetching with direct DB access
async function fetchBusinessData(businessId: string) {
  try {
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(businessId)) {
      return { business: null, services: [], staff: [] };
    }

    const [business, services, staff] = await Promise.all([
      Business.findById(businessId).lean(),
      Service.find({ businessId, status: "listed" }).lean(),
      Staff.find({ businessId }).lean(),
    ]);

    if (!business) {
      return { business: null, services: [], staff: [] };
    }

    // Serialize data for client component
    return JSON.parse(JSON.stringify({
      business,
      services,
      staff
    }));
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
