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
            className="group block bg-card rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex-shrink-0 w-[280px] md:w-[320px]"
            style={{ scrollSnapAlign: "start" }}
        >
            <div className="p-4 space-y-3">
                {/* Business Logo and Name */}
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {image && image !== "/placeholder-logo.png" ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={image}
                                alt={businessName || "Business"}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-lg font-bold text-muted-foreground">
                                {businessName?.charAt(0) || "B"}
                            </span>
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground truncate">
                            {businessName || "Business"}
                        </p>
                        <h3 className="font-semibold text-foreground line-clamp-1 text-sm leading-tight group-hover:text-primary/80 transition-colors">
                            {name}
                        </h3>
                    </div>
                </div>

                {/* Service Details */}
                <div className="space-y-1.5 text-xs text-muted-foreground">
                    {duration && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">Duration:</span>
                            <span>{duration}</span>
                        </div>
                    )}
                    {date && time && (
                        <div className="flex items-center gap-1">
                            <span className="font-medium">Next:</span>
                            <span>{date} {time}</span>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <p className="font-bold text-lg text-foreground">
                        ${price.toFixed(2)}
                    </p>
                    {location && (
                        <div className="flex items-center text-xs text-muted-foreground">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="truncate max-w-[80px]">{location}</span>
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
