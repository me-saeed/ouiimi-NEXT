import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
    title: string;
    description?: string;
    actionHref?: string;
    actionText?: string;
    className?: string;
}

export function SectionHeader({
    title,
    description,
    actionHref,
    actionText = "View all",
    className,
}: SectionHeaderProps) {
    return (
        <div className={cn("flex items-end justify-between mb-8", className)}>
            <div className="space-y-1">
                <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    {title}
                </h2>
                {description && (
                    <p className="text-muted-foreground text-sm md:text-base">
                        {description}
                    </p>
                )}
            </div>

            {actionHref && (
                <Link
                    href={actionHref}
                    className="hidden sm:inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                >
                    {actionText}
                    <svg
                        className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                        />
                    </svg>
                </Link>
            )}
        </div>
    );
}
