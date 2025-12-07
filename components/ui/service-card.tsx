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
            className="group block bg-white rounded-[12px] overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex-shrink-0 w-[320px] sm:w-[320px] md:w-[340px] lg:w-[360px] border border-[#E5E5E5] h-[100px]"
        >
            <div className="p-4 flex gap-4 items-center h-full">
                {/* Left: Business Logo - Large circular placeholder */}
                <div className="w-16 h-16 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center overflow-hidden flex-shrink-0">
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

                {/* Right: Content Area - Three lines, all left-aligned */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    {/* Line 1: Business/Staff Name - Largest, bold, dark gray */}
                    <p className="text-[16px] font-semibold text-[#3A3A3A] truncate leading-none">
                        {businessName || "Business Name"}
                    </p>

                    {/* Line 2: Service Name + Duration + Price - Same line, normal weight, dark gray */}
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-[14px] text-[#3A3A3A] leading-none">{name}</span>
                        {duration && (
                            <span className="text-[14px] text-[#3A3A3A] leading-none">{duration}</span>
                        )}
                        <span className="text-[14px] text-[#3A3A3A] leading-none">${(price || 0).toFixed(2)}</span>
                    </div>

                    {/* Line 3: Date + Time - Smallest, lighter gray, normal weight */}
                    {(date || time) && (
                        <div className="flex items-center gap-2.5">
                            {date && (
                                <span className="text-[12px] text-[#888888] leading-none">{date}</span>
                            )}
                            {time && (
                                <span className="text-[12px] text-[#888888] leading-none">{time}</span>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
