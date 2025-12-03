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
            className="group block bg-[#D9D9D9] rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex-shrink-0 w-full sm:w-[280px] md:w-[300px] lg:w-[320px]"
        >
            <div className="p-4 space-y-3 bg-white">
                {/* Business Logo and Name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white border-2 border-[#D9D9D9] flex items-center justify-center overflow-hidden flex-shrink-0">
                        {image && image !== "/placeholder-logo.png" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={image}
                                alt={businessName || "Business"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold text-[#3A3A3A]">
                                {businessName?.charAt(0) || "B"}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#3A3A3A] truncate">
                            {businessName || "Business"}
                        </p>
                        <h3 className="font-medium text-[#3A3A3A] line-clamp-1 text-sm leading-tight">
                            {name}
                        </h3>
                    </div>
                </div>

                {/* Service Details - Format as per design */}
                <div className="space-y-1 text-sm text-[#3A3A3A]">
                    {duration && (
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Duration:</span>
                            <span>{duration}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="font-medium">Cost:</span>
                        <span className="font-bold">${price.toFixed(2)}</span>
                    </div>
                    {date && (
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Date:</span>
                            <span>{date}</span>
                        </div>
                    )}
                    {time && (
                        <div className="flex items-center justify-between">
                            <span className="font-medium">Time:</span>
                            <span>{time}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
