import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceBookingForm } from "@/components/services/ServiceBookingForm";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import mongoose from "mongoose";

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
    await dbConnect();

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return null;
    }

    const service = await Service.findById(id).lean();
    if (!service) return null;

    // Populate business
    const business = await Business.findById(service.businessId).select('businessName logo address email phone').lean();

    // Convert ObjectIds to strings for serialization
    const serializedService = JSON.parse(JSON.stringify({
      ...service,
      businessId: business || service.businessId
    }));

    // Populate staff details if available
    if (serializedService.timeSlots && serializedService.timeSlots.length > 0) {
      const allStaffIds: string[] = [];
      serializedService.timeSlots.forEach((ts: any) => {
        if (ts.staffIds && Array.isArray(ts.staffIds)) {
          ts.staffIds.forEach((staff: any) => {
            const idStr = String(staff.staffId);
            if (idStr && !allStaffIds.includes(idStr)) {
              allStaffIds.push(idStr);
            }
          });
        }
      });

      if (allStaffIds.length > 0) {
        const staffMembers = await Staff.find({
          _id: { $in: allStaffIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('name photo').lean();

        const staffMap = new Map(
          staffMembers.map((s: any) => [String(s._id), s])
        );

        serializedService.timeSlots = serializedService.timeSlots.map((ts: any) => ({
          ...ts,
          staffIds: ts.staffIds?.map((staff: any) => ({
            ...staff,
            staffDetails: staffMap.get(String(staff.staffId)) || null
          }))
        }));
      }
    }

    return serializedService;
  } catch (error) {
    console.error('[Service Detail Server] Error fetching service:', error);
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

  // Business is already populated in fetchService
  const business = service.businessId;

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

// Generate metadata
export function generateMetadata({ params }: PageProps) {
  return {
    title: `Service Details | ouiimi`,
    description: `Book your service on ouiimi`,
  };
}
