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
                <label className="text-sm font-semibold text-[#3A3A3A]">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}

            {/* Unified Container */}
            <div className="flex items-center justify-between h-[52px] bg-white border border-gray-200 hover:border-gray-300 rounded-xl px-4 transition-all focus-within:ring-2 focus-within:ring-[#EECFD1]/50 focus-within:border-[#EECFD1] focus-within:ring-offset-0 shadow-sm hover:shadow-md">

                {/* Time Inputs Group */}
                <div className="flex items-center gap-1">
                    {/* Hour */}
                    <Select value={selectedHour} onValueChange={handleHourChange}>
                        <SelectTrigger className="w-[54px] border-none shadow-none bg-transparent p-0 h-9 focus:ring-0 focus:ring-offset-0 text-base font-medium text-[#3A3A3A] px-0 justify-center gap-1 cursor-pointer">
                            <SelectValue placeholder="09" />
                        </SelectTrigger>
                        <SelectContent>
                            {hours.map((h) => (
                                <SelectItem key={h} value={h.toString().padStart(2, '0')} className="cursor-pointer">
                                    {h.toString().padStart(2, '0')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <span className="text-[#3A3A3A] font-bold px-1 pb-0.5">:</span>

                    {/* Minute */}
                    <Select value={selectedMinute} onValueChange={handleMinuteChange}>
                        <SelectTrigger className="w-[54px] border-none shadow-none bg-transparent p-0 h-9 focus:ring-0 focus:ring-offset-0 text-base font-medium text-[#3A3A3A] px-0 justify-center gap-1 cursor-pointer">
                            <SelectValue placeholder="00" />
                        </SelectTrigger>
                        <SelectContent>
                            {minutes.map((m) => (
                                <SelectItem key={m} value={m.toString().padStart(2, '0')} className="cursor-pointer">
                                    {m.toString().padStart(2, '0')}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* AM/PM Toggle Pill */}
                <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1 gap-1 h-9">
                    <button
                        type="button"
                        onClick={(e) => handlePeriodChange(e, 'AM')}
                        className={cn(
                            "flex-1 px-3 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all cursor-pointer select-none min-w-[36px]",
                            selectedPeriod === 'AM'
                                ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm transform scale-105"
                                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                        )}
                    >
                        AM
                    </button>
                    <button
                        type="button"
                        onClick={(e) => handlePeriodChange(e, 'PM')}
                        className={cn(
                            "flex-1 px-3 h-full flex items-center justify-center rounded-md text-sm font-bold transition-all cursor-pointer select-none min-w-[36px]",
                            selectedPeriod === 'PM'
                                ? "bg-[#EECFD1] text-[#3A3A3A] shadow-sm transform scale-105"
                                : "text-gray-400 hover:text-gray-600 hover:bg-white/50"
                        )}
                    >
                        PM
                    </button>
                </div>
            </div>
        </div>
    )
}
