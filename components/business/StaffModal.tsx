"use client";

import { useEffect } from "react";
import { StaffForm } from "./StaffForm";

interface StaffModalProps {
    isOpen: boolean;
    onClose: () => void;
    staffId?: string; // If undefined, we are adding new staff
    onSuccess: () => void;
}

export function StaffModal({
    isOpen,
    onClose,
    staffId,
    onSuccess,
}: StaffModalProps) {

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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200 hide-scrollbar">
                <StaffForm
                    key={staffId || 'new-staff'}
                    staffId={staffId}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}
