"use client";

import { useEffect, useRef } from "react";
import { Button } from "./button";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    maxWidth?: string;
}

export function Modal({
    isOpen,
    onClose,
    title,
    children,
    className = "",
    maxWidth = "max-w-md"
}: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

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

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEscape);
        return () => window.removeEventListener("keydown", handleEscape);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div
                ref={modalRef}
                className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 ${className}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
                    <h3 className="text-lg font-bold text-[#3A3A3A]">{title}</h3>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    >
                        ✕
                    </Button>
                </div>

                {/* Body - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
}
