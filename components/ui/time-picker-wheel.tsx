"use client"

import React, { useEffect, useState, useCallback, useRef } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { cn } from '@/lib/utils'

const CIRCLE_DEGREES = 360
const WHEEL_ITEM_SIZE = 32
const WHEEL_ITEM_COUNT = 18
const WHEEL_ITEMS_IN_VIEW = 2

const WHEEL_RADIUS = WHEEL_ITEM_SIZE / 2 / Math.sin(Math.PI / WHEEL_ITEMS_IN_VIEW)

interface Props {
    value: string
    onChange: (value: string) => void
    loop?: boolean
    label?: string
}

const hours = Array.from({ length: 12 }, (_, i) => i + 1)
const minutes = Array.from({ length: 12 }, (_, i) => i * 5)
const periods = ['AM', 'PM']

export const TimePickerWheel: React.FC<Props> = ({ value, onChange, label }) => {
    const [selectedHour, setSelectedHour] = useState(12)
    const [selectedMinute, setSelectedMinute] = useState(0)
    const [selectedPeriod, setSelectedPeriod] = useState('AM')

    // Parse initial value "HH:mm" (24h) to 12h pieces
    useEffect(() => {
        if (value) {
            const [hStr, mStr] = value.split(':')
            let h = parseInt(hStr, 10)
            const m = parseInt(mStr, 10)

            const p = h >= 12 ? 'PM' : 'AM'
            if (h === 0) h = 12
            else if (h > 12) h -= 12

            setSelectedHour(h)
            // Round minute to nearest 5
            const roundedM = Math.round(m / 5) * 5
            setSelectedMinute(roundedM === 60 ? 0 : roundedM)
            setSelectedPeriod(p)
        }
    }, [value])

    const updateTime = useCallback((h: number, m: number, p: string) => {
        let hour24 = h
        if (p === 'PM' && h !== 12) hour24 += 12
        if (p === 'AM' && h === 12) hour24 = 0

        const timeString = `${hour24.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
        onChange(timeString)
    }, [onChange])

    const handleHourChange = (idx: number) => {
        const newHour = hours[idx]
        setSelectedHour(newHour)
        updateTime(newHour, selectedMinute, selectedPeriod)
    }

    const handleMinuteChange = (idx: number) => {
        const newMinute = minutes[idx]
        setSelectedMinute(newMinute)
        updateTime(selectedHour, newMinute, selectedPeriod)
    }

    const handlePeriodChange = (idx: number) => {
        const newPeriod = periods[idx]
        setSelectedPeriod(newPeriod)
        updateTime(selectedHour, selectedMinute, newPeriod)
    }

    return (
        <div className="flex flex-col items-center">
            {label && <label className="text-sm font-medium text-gray-700 mb-2">{label}</label>}
            <div className="relative flex h-32 w-full max-w-[240px] justify-center overflow-hidden rounded-xl bg-gray-50 border border-gray-200">
                <div className="absolute inset-x-0 top-1/2 -mt-[16px] h-[32px] bg-white border-y border-gray-200 pointer-events-none z-10 opacity-80" />

                <Wheel
                    loop
                    items={hours}
                    onIndexChange={(idx) => handleHourChange(idx)}
                    startIndex={hours.indexOf(selectedHour)}
                    className="w-16"
                />
                <div className="flex items-center justify-center font-bold pb-2 z-20">:</div>
                <Wheel
                    loop
                    items={minutes.map(m => m.toString().padStart(2, '0'))}
                    onIndexChange={(idx) => handleMinuteChange(idx)}
                    startIndex={minutes.indexOf(selectedMinute)}
                    className="w-16"
                />
                <Wheel
                    items={periods}
                    onIndexChange={(idx) => handlePeriodChange(idx)}
                    startIndex={periods.indexOf(selectedPeriod)}
                    className="w-16"
                />
            </div>
        </div>
    )
}

interface WheelProps {
    loop?: boolean
    items: (string | number)[]
    onIndexChange: (index: number) => void
    startIndex?: number
    className?: string
}

const Wheel: React.FC<WheelProps> = ({ loop, items, onIndexChange, startIndex = 0, className }) => {
    const [emblaRef, emblaApi] = useEmblaCarousel({
        loop,
        axis: 'y',
        dragFree: true,
        containScroll: false,
        watchSlides: false,
    })
    const rootNodeRef = useRef<HTMLDivElement>(null)

    const onSelect = useCallback((emblaApi: any) => {
        const index = emblaApi.selectedScrollSnap()
        onIndexChange(index)
    }, [onIndexChange])

    useEffect(() => {
        if (!emblaApi) return
        emblaApi.on('select', onSelect)
        emblaApi.scrollTo(startIndex, true)
    }, [emblaApi, onSelect, startIndex])

    return (
        <div className={cn("h-full flex items-center justify-center select-none touch-pan-y cursor-grab active:cursor-grabbing", className)}>
            <div className="h-full overflow-hidden" ref={emblaRef}>
                <div className="h-full flex flex-col -my-[calc(50%-16px)]">
                    {items.map((item, i) => (
                        <div
                            key={i}
                            className="flex h-[32px] items-center justify-center text-sm font-medium text-gray-900 opacity-40 data-[active=true]:opacity-100 data-[active=true]:scale-110 transition-all"
                            style={{ flex: '0 0 32px' }}
                        >
                            {item}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
