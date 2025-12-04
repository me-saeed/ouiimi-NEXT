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
            <div className="p-3 flex gap-3 items-start">
                {/* Left: Business Logo */}
                <div className="w-10 h-10 rounded-full bg-white border-2 border-[#F5F5F5] flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
                    {image && image !== "/placeholder-logo.png" ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={image}
                            alt={businessName || "Business"}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-bold text-[#3A3A3A] bg-[#EECFD1] w-full h-full flex items-center justify-center">
                            {businessName?.charAt(0) || "B"}
                        </span>
                    )}
                </div>

                {/* Right: Content Area */}
                <div className="flex-1 min-w-0 space-y-0.5">
                    {/* Row 1: Business Name */}
                    <p className="text-[10px] font-semibold text-[#888888] uppercase tracking-wide truncate">
                        {businessName || "Business"}
                    </p>

                    {/* Row 2: Service Name + Duration + Cost */}
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="font-semibold text-[#3A3A3A] line-clamp-1 text-sm leading-tight flex-1">
                            {name}
                        </h3>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            {duration && (
                                <span className="text-xs text-[#888888] font-medium">{duration}</span>
                            )}
                            <span className="text-sm font-bold text-[#3A3A3A]">${price.toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Row 3: Date + Time */}
                    {(date || time) && (
                        <div className="flex items-center gap-3 pt-0.5">
                            {date && (
                                <span className="text-xs text-[#3A3A3A] font-medium">{date}</span>
                            )}
                            {time && (
                                <span className="text-xs text-[#3A3A3A] font-medium">{time}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
