/**
 * Admin Dashboard Tabs Component
 * Navigation for admin dashboard sections
 */
"use client";

import { cn } from "@/lib/utils";

interface Tab {
    id: string;
    label: string;
    count?: number;
    icon?: React.ReactNode;
}

interface AdminTabsProps {
    tabs: Tab[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export function AdminTabs({ tabs, activeTab, onTabChange }: AdminTabsProps) {
    return (
        <div className="bg-white border-b border-gray-200 sticky top-16 z-10">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex overflow-x-auto scrollbar-hide">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={cn(
                                "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                                activeTab === tab.id
                                    ? "border-[#EECFD1] text-[#3A3A3A]"
                                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                            )}
                        >
                            {tab.icon && <span>{tab.icon}</span>}
                            <span>{tab.label}</span>
                            {tab.count !== undefined && (
                                <span
                                    className={cn(
                                        "ml-2 px-2 py-0.5 text-xs rounded-full",
                                        activeTab === tab.id
                                            ? "bg-[#EECFD1] text-white"
                                            : "bg-gray-100 text-gray-600"
                                    )}
                                >
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
