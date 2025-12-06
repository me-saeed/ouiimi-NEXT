"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ServiceCarouselProps {
  children: React.ReactNode;
  title?: string;
  viewAllHref?: string;
  totalCount?: number;
  showMoreHref?: string;
}

export function ServiceCarousel({ children, title, viewAllHref, totalCount = 0, showMoreHref }: ServiceCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showShowMore, setShowShowMore] = useState(false);

  const checkScrollability = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollability();
    // Show "Show more" button when there are more than 6 services
    if (totalCount > 6) {
      setShowShowMore(true);
    } else {
      setShowShowMore(false);
    }
    
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener("scroll", checkScrollability);
      window.addEventListener("resize", checkScrollability);
      return () => {
        container.removeEventListener("scroll", checkScrollability);
        window.removeEventListener("resize", checkScrollability);
      };
    }
  }, [children, totalCount]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === "left"
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative mb-8 sm:mb-10 md:mb-[40px]">
      {/* Header */}
      {title && (
        <div className="flex items-center justify-between mb-4 sm:mb-5 md:mb-6">
          <h2 className="text-[18px] sm:text-[20px] md:text-[24px] font-bold text-[#3A3A3A]">{title}</h2>
        </div>
      )}

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow - Hidden on mobile */}
        {canScrollLeft && (
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 h-10 w-10 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:bg-gray-50 hover:border-[#EECFD1] transition-all"
            onClick={() => scroll("left")}
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-5 w-5 text-[#3A3A3A]" />
          </Button>
        )}

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide scroll-smooth -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8"
          style={{
            scrollSnapType: "x proximity",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {children}
          {/* Show More Button - Appears when there are more than 6 services */}
          {showShowMore && showMoreHref && (
            <div className="flex-shrink-0 flex items-center min-w-[100px]">
              <Link
                href={showMoreHref}
                className="text-xs sm:text-sm text-[#3A3A3A] hover:text-[#EECFD1] font-medium inline-flex items-center gap-1 transition-colors underline whitespace-nowrap px-2"
              >
                Show more
              </Link>
            </div>
          )}
          {/* Spacer to show peek of next card on mobile */}
          <div className="flex-shrink-0 w-4 md:w-0" />
        </div>

        {/* Right Arrow - Hidden on mobile */}
        {canScrollRight && (
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 h-10 w-10 rounded-full bg-white border-2 border-gray-200 shadow-lg hover:bg-gray-50 hover:border-[#EECFD1] transition-all"
            onClick={() => scroll("right")}
            aria-label="Scroll right"
          >
            <ChevronRight className="h-5 w-5 text-[#3A3A3A]" />
          </Button>
        )}
      </div>
    </div>
  );
}

