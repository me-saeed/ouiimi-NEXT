"use client";

import React from "react";

interface StaffCardProps {
    id: string;
    name: string;
    photo?: string;
    about?: string;
    onClick?: () => void;
}

export const StaffCard = React.memo(function StaffCard({
    name,
    photo,
    about,
    onClick,
}: StaffCardProps) {
    return (
        <div
            onClick={onClick}
            className="group relative bg-white rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 border border-gray-100 hover:border-[#EECFD1]/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1"
        >
            {/* Avatar Container */}
            <div className="relative mb-4 inline-block">
                <div className="w-24 h-24 rounded-full p-1 border-2 border-transparent group-hover:border-[#EECFD1]/30 transition-all duration-300">
                    <div className="w-full h-full rounded-full overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
                        {photo ? (
                            <img
                                src={photo}
                                alt={name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#EECFD1]/20 to-[#EECFD1]/10 flex items-center justify-center">
                                <span className="text-3xl font-bold text-[#EECFD1]">
                                    {name.charAt(0).toUpperCase()}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Indicator (Optional decorative element) */}
                <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-400 border-2 border-white shadow-sm" />
            </div>

            {/* Content */}
            <div className="space-y-2">
                <h3 className="font-bold text-lg text-[#3A3A3A] group-hover:text-[#EECFD1] transition-colors duration-300">
                    {name}
                </h3>
                {about && (
                    <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed px-2">
                        {about}
                    </p>
                )}
            </div>

            {/* Professional Badge (Optional) */}
            <div className="mt-4 pt-4 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <span className="text-[10px] uppercase tracking-widest font-bold text-[#EECFD1]">
                    View Profile
                </span>
            </div>
        </div>
    );
});
