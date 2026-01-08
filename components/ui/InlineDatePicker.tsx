'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InlineDatePickerProps {
    selectedDate: string | null;
    onSelectDate: (dateStr: string | null) => void;
    currentMonth: number;
    currentYear: number;
    onPrevMonth: () => void;
    onNextMonth: () => void;
    onGoToCurrentMonth: () => void;
    getBookingCountForDate?: (dateStr: string) => number;
}

export function InlineDatePicker({
    selectedDate,
    onSelectDate,
    currentMonth,
    currentYear,
    onPrevMonth,
    onNextMonth,
    onGoToCurrentMonth,
    getBookingCountForDate
}: InlineDatePickerProps) {
    // Get today's date in Australian timezone
    const getAustralianToday = () => {
        const now = new Date();
        const australianDate = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        return australianDate;
    };

    const australianToday = getAustralianToday();
    const todayStr = [
        australianToday.getFullYear(),
        String(australianToday.getMonth() + 1).padStart(2, '0'),
        String(australianToday.getDate()).padStart(2, '0')
    ].join('-');

    // Generate all dates for current month (only today and future)
    const monthDates = useMemo(() => {
        const dates: Array<{ date: Date; dateStr: string; day: number; weekday: string }> = [];
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Get today in Australian timezone for comparison
        const now = new Date();
        const australianNow = new Date(now.toLocaleString('en-US', { timeZone: 'Australia/Sydney' }));
        const todayYear = australianNow.getFullYear();
        const todayMonth = australianNow.getMonth();
        const todayDay = australianNow.getDate();

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);

            // Skip past dates (before Australian today)
            if (currentYear < todayYear ||
                (currentYear === todayYear && currentMonth < todayMonth) ||
                (currentYear === todayYear && currentMonth === todayMonth && day < todayDay)) {
                continue;
            }

            const dateStr = [
                date.getFullYear(),
                String(date.getMonth() + 1).padStart(2, '0'),
                String(date.getDate()).padStart(2, '0')
            ].join('-');
            dates.push({
                date,
                dateStr,
                day,
                weekday: date.toLocaleDateString('en-US', { weekday: 'short' })
            });
        }
        return dates;
    }, [currentMonth, currentYear]);

    return (
        <div className="space-y-4">
            {/* Month Navigation Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-base md:text-lg font-semibold text-[#3A3A3A]">Filter by Date</h3>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onPrevMonth}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onGoToCurrentMonth}
                        className="h-8 px-3 text-xs"
                    >
                        {new Date(currentYear, currentMonth).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onNextMonth}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Swipeable Date Picker - Horizontal Scroll */}
            <div className="relative border-b border-gray-100 pb-4">
                {monthDates.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                        No dates available in this month
                    </div>
                ) : (
                    <div
                        ref={(el) => {
                            if (el) {
                                // Scroll to selected date if exists, otherwise scroll to first visible date (today)
                                const targetDate = selectedDate || todayStr;
                                const targetIndex = monthDates.findIndex(d => d.dateStr === targetDate);

                                if (targetIndex >= 0) {
                                    const itemWidth = 60;
                                    const scrollPos = targetIndex * itemWidth - (el.offsetWidth / 2) + (itemWidth / 2);
                                    el.scrollLeft = Math.max(0, scrollPos);
                                }
                            }
                        }}
                        className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2"
                        style={{
                            scrollbarWidth: 'none',
                            msOverflowStyle: 'none',
                            WebkitOverflowScrolling: 'touch'
                        }}
                    >
                        {monthDates.map(({ date, dateStr, day, weekday }) => {
                            const count = getBookingCountForDate ? getBookingCountForDate(dateStr) : 0;
                            const isSelected = selectedDate === dateStr;
                            const isToday = dateStr === todayStr;

                            return (
                                <button
                                    key={dateStr}
                                    onClick={() => onSelectDate(isSelected ? null : dateStr)}
                                    className={`flex flex-col items-center justify-center min-w-[50px] h-[60px] md:h-[70px] rounded-2xl transition-all duration-200 relative group ${isSelected
                                        ? "bg-[#3A3A3A] text-white shadow-md transform scale-105"
                                        : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    <span className={`text-[10px] font-medium uppercase tracking-wide mb-1 ${isSelected ? 'text-white/80' : ''
                                        }`}>
                                        {weekday}
                                    </span>
                                    <span className={`text-base md:text-lg font-bold ${isSelected ? 'text-white' : 'text-[#3A3A3A]'
                                        }`}>
                                        {day}
                                    </span>

                                    {/* Dots for bookings */}
                                    <div className="flex gap-0.5 mt-1 h-1">
                                        {count > 0 && (
                                            <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#EECFD1]'
                                                }`} />
                                        )}
                                        {count > 1 && (
                                            <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#EECFD1]'
                                                }`} />
                                        )}
                                        {count > 2 && (
                                            <span className={`text-[6px] leading-none ${isSelected ? 'text-white' : 'text-[#EECFD1]'
                                                }`}>+</span>
                                        )}
                                    </div>

                                    {/* Today Indicator */}
                                    {isToday && !isSelected && (
                                        <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#EECFD1] rounded-full" />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Selected Date Info */}
            {selectedDate && (
                <div className="flex items-center justify-between p-3 bg-[#EECFD1]/10 rounded-xl border border-[#EECFD1]">
                    <span className="text-sm font-medium text-[#3A3A3A]">
                        {new Date(selectedDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSelectDate(null)}
                        className="text-xs text-gray-600 hover:text-[#3A3A3A]"
                    >
                        Clear
                    </Button>
                </div>
            )}
        </div>
    );
}
