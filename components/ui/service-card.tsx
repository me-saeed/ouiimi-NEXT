import Link from "next/link";
import React from "react";

interface ServiceCardProps {
    id: string;
    name: string;
    price: number;
    image: string;
    category?: string;
    subCategory?: string;
    businessName?: string;
    location?: string;
    duration?: string;
    date?: string | null;
    time?: string | null;
    bookingId?: string;
    bookingNumber?: number | null;  // Sequential booking number (5000, 5001, etc.)
    status?: string;
}

export const ServiceCard = React.memo(function ServiceCard({
    id,
    name,
    price,
    image,
    category,
    businessName,
    location,
    duration,
    date,
    time,
    bookingId,
    bookingNumber,
    status
}: ServiceCardProps) {
    const isBooked = !!bookingNumber || !!bookingId;

    return (
        <Link
            href={`/services/${id}`}
            className="group block bg-white rounded-[12px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0 w-[265px] sm:w-[336px] md:w-[360px] lg:w-[380px] border border-[#E5E5E5]"
        >
            <div className="p-2.5 sm:p-3 flex gap-2.5 sm:gap-3 items-start">
                {/* Left: Business Logo */}
                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center overflow-hidden flex-shrink-0 mt-1">
                    {image && image !== "/placeholder-logo.png" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={image}
                            alt={businessName || "Business"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-sm sm:text-lg font-bold text-[#3A3A3A] bg-[#EECFD1] w-full h-full flex items-center justify-center">
                            {businessName?.charAt(0) || "B"}
                        </span>
                    )}
                </div>

                {/* Right: Content Grid */}
                <div className="flex-1 min-w-0 flex flex-col gap-1 sm:gap-1.5">
                    {/* Row 1: Business Name | Booking ID */}
                    <div className="flex justify-between items-start">
                        <p className="text-[13px] sm:text-[15px] font-semibold text-[#3A3A3A] truncate pr-1 sm:pr-2">
                            {businessName || "Business Name"}
                        </p>
                        {bookingNumber && (
                            <span className="text-[10px] sm:text-[13px] text-[#666666] whitespace-nowrap pt-0.5 sm:pt-0">
                                ID: {bookingNumber}
                            </span>
                        )}
                    </div>

                    {/* Row 2: Service Name | Duration (Price in browse mode) */}
                    <div className="flex justify-between items-center">
                        <p className="text-[12px] sm:text-[14px] text-[#4a4a4a] truncate pr-1 sm:pr-2 flex-1">
                            {name}
                        </p>
                        <div className="flex items-center gap-2 sm:gap-4 text-[11px] sm:text-[13px] text-[#666666] flex-shrink-0">
                            {duration && <span>{duration}</span>}
                            {!isBooked && price > 0 && (
                                <span className="font-medium text-[#3A3A3A]">${price.toFixed(0)}</span>
                            )}
                        </div>
                    </div>

                    {/* Row 3: Date | Time */}
                    {(date || time) && (
                        <div className="flex justify-between items-center text-[10px] sm:text-[13px] text-[#666666] mt-0.5">
                            <span>{date}</span>
                            <span>{time}</span>
                        </div>
                    )}

                    {/* Row 4: Status (Booked only) */}
                    {status && (
                        <div className="mt-0.5 sm:mt-1 text-center">
                            {status === "completed" && (
                                <span className="text-green-500 font-medium text-[11px] sm:text-sm">Finished</span>
                            )}
                            {status === "cancelled" && (
                                <span className="text-red-500 font-medium text-[11px] sm:text-sm">Cancelled</span>
                            )}
                            {status === "pending" && (
                                <span className="text-amber-500 font-medium text-[11px] sm:text-sm">Awaiting Payment</span>
                            )}
                            {status === "confirmed" && (
                                <span className="text-blue-500 font-medium text-[11px] sm:text-sm">Confirmed</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
});
