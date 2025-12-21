"use client"

import React, { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface TimeSelectProps {
    value: string // 24-hour format "HH:mm"
    onChange: (value: string) => void
    label?: string
    className?: string
    required?: boolean
}

// Generate hours 1-12
const hours = Array.from({ length: 12 }, (_, i) => i + 1)

// Generate minutes in 5-minute increments
const minutes = Array.from({ length: 12 }, (_, i) => i * 5)

export const TimeSelect: React.FC<TimeSelectProps> = ({
    value,
    onChange,
    label,
    className,
    required
}) => {
    // Parse value directly from props (Derived State)
    const parseTime = (timeStr: string) => {
        if (!timeStr || !timeStr.includes(':')) {
            return { h: "09", m: "00", period: "AM" }
        }
        const [hStr, mStr] = timeStr.split(':')
        let h = parseInt(hStr, 10)
        const m = parseInt(mStr, 10)

        const period = h >= 12 ? 'PM' : 'AM'
        if (h === 0) h = 12
        else if (h > 12) h -= 12

        return {
            h: h.toString().padStart(2, '0'),
            m: m.toString().padStart(2, '0'), // m is already correct 0-59
            period
        }
    }

    const { h: selectedHour, m: selectedMinute, period: selectedPeriod } = parseTime(value)

    // Sync default value if empty
    useEffect(() => {
        if (!value) {
            // Defer to avoid render loop
            const timer = setTimeout(() => onChange("09:00"), 0)
            return () => clearTimeout(timer)
        }
    }, [value, onChange])

    // Helper to construct time string
    const constructTime = (h: string, m: string, p: string) => {
        let hourInt = parseInt(h, 10)
        const minuteInt = parseInt(m, 10)
        let hour24 = hourInt

        if (p === 'PM' && hourInt !== 12) {
            hour24 += 12
        } else if (p === 'AM' && hourInt === 12) {
            hour24 = 0
        }

        return `${hour24.toString().padStart(2, '0')}:${minuteInt.toString().padStart(2, '0')}`
    }

    const handleHourChange = (val: string) => {
        onChange(constructTime(val, selectedMinute, selectedPeriod))
    }

    const handleMinuteChange = (val: string) => {
        onChange(constructTime(selectedHour, val, selectedPeriod))
    }

    const handlePeriodChange = (e: React.MouseEvent, val: string) => {
        e.preventDefault()
        // Optimize: if value mimics current Period, do nothing
        if (val === selectedPeriod) return

        onChange(constructTime(selectedHour, selectedMinute, val))
    }

    return (
        <div className={cn("space-y-2", className)}>
            {label && (
                <label className="text-sm font-semibold text-[#3A3A3A] block">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Clean Time Input Container */}
            <div className="relative w-full h-[52px] bg-white border border-[#E5E5E5] hover:border-gray-300 rounded-xl transition-all focus-within:ring-2 focus-within:ring-[#EECFD1]/20 focus-within:border-[#EECFD1] flex items-center overflow-hidden">

                {/* Hour Select */}
                <div className="flex-1 h-full">
                    <Select value={selectedHour} onValueChange={handleHourChange}>
                        <SelectTrigger className="w-full h-full border-none shadow-none bg-transparent hover:bg-gray-50/50 focus:ring-0 text-center text-base font-medium text-[#3A3A3A] px-2 gap-0 rounded-none [&>svg]:hidden">
                            <SelectValue placeholder="09" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] z-[9999] min-w-[70px]">
                            {hours.map((h) => (
                                <SelectItem key={h} value={h.toString().padStart(2, '0')} className="text-center justify-center">
                                    {h.toString().padStart(2, '0')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Divider */}
                <span className="text-gray-400 font-normal text-base select-none">:</span>

                {/* Minute Select */}
                <div className="flex-1 h-full">
                    <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                        <SelectTrigger className="w-full h-full border-none shadow-none bg-transparent hover:bg-gray-50/50 focus:ring-0 text-center text-base font-medium text-[#3A3A3A] px-2 gap-0 rounded-none [&>svg]:hidden">
                            <SelectValue placeholder="00" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] z-[9999] min-w-[70px]">
                            {minutes.map((m) => (
                                <SelectItem key={m} value={m.toString().padStart(2, '0')} className="text-center justify-center">
                                    {m.toString().padStart(2, '0')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Vertical Divider */}
                <div className="w-px h-6 bg-gray-200 mx-2" />

                {/* AM/PM Select */}
                <div className="w-16 h-full">
                    <Select value={selectedPeriod} onValueChange={(val) => onChange(constructTime(selectedHour, selectedMinute, val))}>
                        <SelectTrigger className="w-full h-full border-none shadow-none bg-transparent hover:bg-gray-50/50 focus:ring-0 text-center text-sm font-semibold text-gray-600 px-2 justify-center rounded-none [&>svg]:hidden">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[9999] min-w-[70px]">
                            <SelectItem value="AM" className="text-center justify-center font-medium">AM</SelectItem>
                            <SelectItem value="PM" className="text-center justify-center font-medium">PM</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

            </div>
        </div>
    )
}
