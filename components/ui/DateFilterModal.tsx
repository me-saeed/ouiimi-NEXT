'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DateFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectDate: (date: Date) => void;
    onClear?: () => void;
    selectedDate?: Date | null;
}

export function DateFilterModal({ isOpen, onClose, onSelectDate, onClear, selectedDate }: DateFilterModalProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            // Start from selected date's month or current month
            if (selectedDate) {
                setCurrentMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
            } else {
                const today = new Date();
                setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
            }
        }
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const handleDateClick = (day: number) => {
        const selected = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        selected.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues
        onSelectDate(selected);
        onClose();
    };

    const handleClear = () => {
        onClear?.();
        onClose();
    };

    const isSelectedDate = (day: number) => {
        if (!selectedDate) return false;
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear();
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
                    <h3 className="text-sm font-semibold text-gray-900">Filter by Date</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Month Navigation */}
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                    <button
                        type="button"
                        onClick={prevMonth}
                        className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-700" />
                    </button>
                    <span className="text-sm font-semibold text-gray-900">
                        {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </span>
                    <button
                        type="button"
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
                            const selected = isSelectedDate(day);
                            const today = isToday(day);

                            return (
                                <button
                                    type="button"
                                    key={day}
                                    onClick={() => handleDateClick(day)}
                                    className={`
                                        h-10 w-full rounded-lg text-sm font-medium transition-all cursor-pointer active:scale-95
                                        ${selected
                                            ? 'bg-[#EECFD1] text-gray-900'
                                            : 'text-gray-900 hover:bg-[#EECFD1]/50'
                                        }
                                        ${today && !selected ? 'ring-2 ring-[#EECFD1] ring-offset-1' : ''}
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between gap-2 px-4 py-3 border-t border-gray-100 bg-gray-50">
                    {selectedDate && onClear && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                            Clear Filter
                        </Button>
                    )}
                    <div className="flex-1" />
                    <Button
                        type="button"
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
