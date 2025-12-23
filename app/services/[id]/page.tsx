import Link from "next/link";
import PageLayout from "@/components/layout/PageLayout";
import { ServiceBookingForm } from "@/components/services/ServiceBookingForm";
import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Service from "@/lib/models/Service";
import Business from "@/lib/models/Business";
import Staff from "@/lib/models/Staff";
import mongoose from "mongoose";
import { ArrowLeft, Tag } from "lucide-react";
import { ServiceCard } from "@/components/ui/service-card";

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
        const staffMembers = JSON.parse(JSON.stringify(await Staff.find({
          _id: { $in: allStaffIds.map(id => new mongoose.Types.ObjectId(id)) }
        }).select('name photo').lean()));

        const staffMap = new Map(
          staffMembers.map((s: any) => [String(s._id || s.id), s])
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

    // Fetch other services from this business
    const otherServices = await Service.find({
      businessId: service.businessId,
      _id: { $ne: service._id },
      status: 'listed'
    }).limit(3).select('serviceName category subCategory address price timeSlots').lean();

    const serializedOtherServices = JSON.parse(JSON.stringify(otherServices)).map((s: any) => ({
      ...s,
      businessId: business // Include business info for the cards
    }));

    return {
      service: serializedService,
      otherServices: serializedOtherServices
    };
  } catch (error) {
    console.error('[Service Detail Server] Error fetching service:', error);
    return null;
  }
}

// Main Server Component
export default async function ServiceDetailPage({ params }: PageProps) {
  // Fetch service data server-side
  const result = await fetchService(params.id);

  // Return 404 if service not found
  if (!result) {
    notFound();
  }

  const { service, otherServices } = result;
  const business = service.businessId;

  return (
    <PageLayout>
      <div className="bg-gray-50/50 min-h-screen py-8 md:py-12">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">

          {/* Top Navigation & Breadcrumbs */}
          <div className="flex flex-col gap-4 mb-8">
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#EECFD1] transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Explore
            </Link>

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
                <Tag className="w-3 h-3 text-[#EECFD1]" />
                {service.category}
              </span>
              {service.subCategory && (
                <span className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs font-semibold text-gray-600 shadow-sm">
                  {service.subCategory}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Main Content - Booking Form Card */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
                <div className="p-1"> {/* Thin border container */}
                  <div className="p-6 md:p-10">
                    <ServiceBookingForm service={service} business={business} />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Information (Desktop Only) */}
            <div className="hidden lg:flex flex-col gap-6">
              {/* Business Quick Info */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wider">Business Details</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-[#EECFD1] uppercase tracking-[0.1em] mb-1.5 flex items-center gap-1.5">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Address
                    </p>
                    <p className="text-sm text-gray-800 leading-relaxed font-semibold">
                      {typeof service.address === 'string' ? service.address : service.address?.street}
                    </p>
                  </div>
                  {business?.phone && (
                    <div className="px-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.1em] mb-1">Contact</p>
                      <p className="text-sm text-gray-600 font-medium">{business.phone}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Secure Booking Badge */}
              <div className="bg-[#EECFD1]/10 rounded-2xl p-6 border border-[#EECFD1]/20">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EECFD1] flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 mb-1">Secure Booking</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Your payment is protected and managed securely via Stripe.
                    </p>
                  </div>
                </div>
              </div>
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
