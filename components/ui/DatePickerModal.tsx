'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: string) => void;
    minDate?: Date;
}

export function DatePickerModal({ isOpen, onClose, onSelectDate, minDate }: DatePickerModalProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Set default min date to today
    const effectiveMinDate = minDate || new Date();
    effectiveMinDate.setHours(0, 0, 0, 0);

    useEffect(() => {
        if (isOpen) {
            // Start from current month or min date month if in the future
            const today = new Date();
            if (effectiveMinDate > today) {
                setCurrentMonth(new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1));
            } else {
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => {
        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const minMonth = new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1);
        if (prev >= minMonth) {
            setCurrentMonth(prev);
        }
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selectedDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

        if (selectedDate >= effectiveMinDate) {
            const dateStr = selectedDate.toISOString().split('T')[0];
            onSelectDate(dateStr);
            onClose();
        }
    };

    const isDateDisabled = (day: number) => {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        date.setHours(0, 0, 0, 0);
        return date < effectiveMinDate;
    };

    const canGoPrev = () => {
        const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
        const minMonth = new Date(effectiveMinDate.getFullYear(), effectiveMinDate.getMonth(), 1);
        return prev >= minMonth;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-[340px] max-w-[95vw] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <h3 className="text-sm font-semibold text-gray-900">Select Date</h3>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <button
                        onClick={prevMonth}
                        disabled={!canGoPrev()}
                        className="p-2 rounded-lg hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="p-4">
                    {/* Day headers */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {dayNames.map(day => (
                            <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {/* Empty cells for days before first of month */}
                        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                            <div key={`empty-${i}`} className="h-10" />
                        ))}

                        {/* Days of month */}
                        {Array.from({ length: daysInMonth }).map((_, i) => {
                            const day = i + 1;
                            const disabled = isDateDisabled(day);
                            const isToday =
                                new Date().getDate() === day &&
                                new Date().getMonth() === currentMonth.getMonth() &&
                                new Date().getFullYear() === currentMonth.getFullYear();

                            return (
                                <button
                                    key={day}
                                    onClick={() => !disabled && handleDateClick(day)}
                                    disabled={disabled}
                                    className={`
                    h-10 w-full rounded-lg text-sm font-medium transition-all
                    ${disabled
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : 'text-gray-900 hover:bg-[#E91E63] hover:text-white cursor-pointer active:scale-95'
                                        }
                    ${isToday && !disabled ? 'ring-2 ring-[#E91E63] ring-offset-1' : ''}
                  `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClose}
                        className="text-xs"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
