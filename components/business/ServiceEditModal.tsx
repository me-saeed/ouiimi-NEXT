"use client";

import { useEffect } from "react";
import { EditServiceForm } from "./EditServiceForm";

interface ServiceEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    serviceId: string | null;
    onSuccess: () => void;
}

export function ServiceEditModal({
    isOpen,
    onClose,
    serviceId,
    onSuccess,
}: ServiceEditModalProps) {

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

    if (!isOpen || !serviceId) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Content - Fixed height to ensure internal scrolling works */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <EditServiceForm
                    serviceId={serviceId}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                />
            </div>
        </div>
    );
}
