"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Clock, DollarSign, Calendar, MapPin, Tag, Users, Info, ChevronRight } from "lucide-react";

interface ServiceDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    service: any;
}

export function ServiceDetailModal({ isOpen, onClose, service }: ServiceDetailModalProps) {
    if (!service) return null;

    const formatTime12Hour = (time24: string): string => {
        if (!time24) return "";
        const [hours, minutes] = time24.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const hours12 = hours % 12 || 12;
        return `${hours12}:${String(minutes).padStart(2, "0")} ${period}`;
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
        });
    };

    // Group slots by date
    const groupedSlots = service.timeSlots?.reduce((acc: any, slot: any) => {
        const date = slot.date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(slot);
        return acc;
    }, {}) || {};

    const sortedDates = Object.keys(groupedSlots).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            maxWidth="max-w-lg md:max-w-2xl"
        >
            <div className="space-y-5 px-0 pb-2 max-h-[80vh] overflow-y-auto custom-scrollbar -mt-4">

                {/* HEADER SECTION */}
                <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 pt-1">
                    <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500 uppercase tracking-wide">
                                {service.category}
                                {service.subCategory && (
                                    <>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-gray-700 truncate">{service.subCategory}</span>
                                    </>
                                )}
                            </div>
                            <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">{service.serviceName}</h2>
                        </div>

                        <div className={`px-3 py-1 rounded-full text-xs font-semibold tracking-wide border ${service.timeSlots?.length > 0 ? 'bg-green-50 border-green-100 text-green-700' : 'bg-gray-50 border-gray-100 text-gray-500'}`}>
                            {service.timeSlots?.length > 0 ? 'Active' : 'Draft'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-6">

                    {/* MAIN INFO SECTION */}
                    <div className="space-y-5">

                        {/* 1. METRICS GRID */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Duration Card */}
                            <div className="p-4 rounded-xl bg-white border border-gray-100 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                    <Clock className="w-3 h-3" />
                                    Duration
                                </div>
                                <p className="text-xl font-semibold text-gray-900">{service.duration ? `${service.duration}m` : '-'}</p>
                            </div>

                            {/* Price Card */}
                            <div className="p-4 rounded-xl bg-white border border-gray-100 flex flex-col gap-1">
                                <div className="flex items-center gap-1.5 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                                    <DollarSign className="w-3 h-3" />
                                    Starting At
                                </div>
                                <p className="text-xl font-semibold text-gray-900">
                                    ${service.timeSlots && service.timeSlots.length > 0
                                        ? Math.min(...service.timeSlots.map((s: any) => s.price)).toFixed(0)
                                        : (service.baseCost || 0).toFixed(0)}
                                </p>
                            </div>
                        </div>

                        {/* 2. DESCRIPTION */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                About Service
                            </h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                {service.description || "No description provided."}
                            </p>
                        </div>

                        {/* 3. LOCATION */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                Location
                            </h3>
                            {service.address && service.address.street ? (
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                                    <MapPin className="w-4 h-4 text-gray-500 shrink-0" />
                                    <p className="text-sm text-gray-700">{service.address.street}</p>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-gray-200 text-gray-500 text-sm">
                                    <MapPin className="w-4 h-4 opacity-50" />
                                    Use business address (default)
                                </div>
                            )}
                        </div>

                        {/* 4. ADD-ONS */}
                        {service.addOns && service.addOns.length > 0 && (
                            <div className="space-y-3 pt-2">
                                <h3 className="text-sm font-bold text-gray-900">Add-Ons</h3>
                                <div className="space-y-2">
                                    {service.addOns.map((addon: any, idx: number) => (
                                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 px-2 rounded-lg -mx-2 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-1.5 rounded-full bg-gray-300"></div>
                                                <span className="text-sm text-gray-600 font-medium">{addon.name}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-900">+${addon.cost}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* STAFF & SCHEDULE SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2 border-t border-gray-100">

                        {/* STAFF */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Staff</h3>
                            {service.defaultStaffIds && service.defaultStaffIds.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {service.defaultStaffIds.map((staff: any, idx: number) => (
                                        <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 border border-gray-100">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 overflow-hidden shrink-0">
                                                {staff.photo ? (
                                                    <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold text-[10px]">
                                                        {staff.name?.[0] || 'S'}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-medium text-gray-700">{staff.name}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">No staff assigned.</p>
                            )}
                        </div>

                        {/* SCHEDULE */}
                        <div className="space-y-2">
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Schedule</h3>

                            {sortedDates.length > 0 ? (
                                <div className="space-y-3">
                                    {sortedDates.slice(0, 3).map((date) => (
                                        <div key={date} className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0"></div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{formatDate(date)}</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {groupedSlots[date].map((slot: any, idx: number) => (
                                                        <span key={idx} className={`text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 ${slot.isBooked ? 'opacity-40 line-through' : ''}`}>
                                                            {formatTime12Hour(slot.startTime)}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-3 rounded-lg bg-gray-50 border border-dashed border-gray-200 text-center">
                                    <Calendar className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                    <p className="text-xs text-gray-500">No slots available</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className='flex justify-end pt-4 border-t border-gray-100 mt-2'>
                <Button onClick={onClose} variant="outline" className="h-9 px-5 text-sm font-medium border-gray-200 text-gray-700 hover:bg-gray-50 rounded-lg">
                    Close
                </Button>
            </div>
        </Modal>
    );
}
