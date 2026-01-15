"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface StaffDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    staff: any | null;
    footer?: React.ReactNode;
}

export function StaffDetailsModal({
    isOpen,
    onClose,
    staff,
    footer,
}: StaffDetailsModalProps) {

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!isOpen || !staff) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[450px] max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200 hide-scrollbar p-10">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-8 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-20 h-20 rounded-full bg-[#EECFD1] flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                        {staff.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={staff.photo} alt={staff.name} className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold text-[#3A3A3A]">
                                {staff.name?.charAt(0)?.toUpperCase() || "S"}
                            </span>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-[#3A3A3A]">{staff.name}</h3>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${staff.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {staff.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                </div>

                {/* About Section */}
                {(staff.bio || staff.about) && (
                    <div className="mb-5">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            About
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{staff.bio || staff.about}</p>
                    </div>
                )}

                {/* Qualifications Section */}
                {staff.qualifications && (
                    <div className="mb-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 mb-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                            Qualifications
                        </div>
                        <p className="text-sm text-gray-700">{staff.qualifications}</p>
                    </div>
                )}

                {/* Fallback if no details */}
                {!staff.bio && !staff.about && !staff.qualifications && (
                    <div className="w-full bg-[#FDFCFD] rounded-2xl border border-gray-100 p-6 text-center">
                        <p className="text-sm text-gray-500">No additional details available.</p>
                    </div>
                )}

                {/* Footer Actions (e.g. Edit/Delete for Admin) */}
                {footer && (
                    <div className="mt-8 pt-6 border-t border-gray-100">
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}
