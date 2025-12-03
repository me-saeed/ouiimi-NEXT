import Link from "next/link";

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
}

export function ServiceCard({
    id,
    name,
    price,
    image,
    category,
    businessName,
    location,
    duration,
    date,
    time
}: ServiceCardProps) {
    return (
        <Link
            href={`/services/${id}`}
            className="group block bg-white rounded-[12px] overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex-shrink-0 w-full sm:w-[280px] md:w-[300px] lg:w-[320px] border border-[#F5F5F5]"
        >
            <div className="p-[20px] space-y-4">
                {/* Business Logo and Name */}
                <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full bg-white border-2 border-[#F5F5F5] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                        {image && image !== "/placeholder-logo.png" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={image}
                                alt={businessName || "Business"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xl font-bold text-[#3A3A3A] bg-[#EECFD1] w-full h-full flex items-center justify-center">
                                {businessName?.charAt(0) || "B"}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-[#888888] uppercase tracking-wide truncate mb-0.5">
                            {businessName || "Business"}
                        </p>
                        <h3 className="font-semibold text-[#3A3A3A] line-clamp-2 text-base leading-tight">
                            {name}
                        </h3>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#E5E5E5] my-4"></div>

                {/* Service Details - Clean & Structured */}
                <div className="space-y-2.5 text-sm">
                    {duration && (
                        <div className="flex items-center justify-between">
                            <span className="text-[#888888] font-medium">Duration</span>
                            <span className="text-[#3A3A3A] font-semibold">{duration}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-[#888888] font-medium">Cost</span>
                        <span className="text-[#3A3A3A] font-bold text-base">${price.toFixed(2)}</span>
                    </div>
                    {date && (
                        <div className="flex items-center justify-between">
                            <span className="text-[#888888] font-medium">Date</span>
                            <span className="text-[#3A3A3A] font-semibold">{date}</span>
                        </div>
                    )}
                    {time && (
                        <div className="flex items-center justify-between">
                            <span className="text-[#888888] font-medium">Time</span>
                            <span className="text-[#3A3A3A] font-semibold text-xs">{time}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
