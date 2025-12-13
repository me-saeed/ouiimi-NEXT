"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
    value?: string;
    onChange: (url: string) => void;
    disabled?: boolean;
    label?: string;
    variant?: "default" | "avatar";
}

export function ImageUpload({
    value,
    onChange,
    disabled,
    label = "Upload Image",
    variant = "default"
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string>("");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Please upload an image file");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError("Image must be less than 5MB");
            return;
        }

        setError("");
        setIsUploading(true);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/upload", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Upload failed");
            }

            const data = await response.json();
            onChange(data.url);
        } catch (err) {
            console.error("Upload error:", err);
            setError("Failed to upload image. Please try again.");
        } finally {
            setIsUploading(false);
            // Reset input value to allow uploading same file again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleRemove = () => {
        onChange("");
        setError("");
    };

    const handleButtonClick = () => {
        fileInputRef.current?.click();
    };

    if (variant === "avatar") {
        return (
            <div className="flex flex-col items-center">
                <div className="relative mb-2">
                    {value ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={value}
                            alt="Avatar"
                            className="w-24 h-24 rounded-full object-cover border-4 border-[#EECFD1] shadow-sm"
                        />
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-[#EECFD1] border-4 border-white shadow-sm flex items-center justify-center">
                            <span className="text-2xl font-bold text-white">
                                +
                            </span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={handleButtonClick}
                        disabled={disabled || isUploading}
                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold hover:bg-primary/90 cursor-pointer shadow-sm disabled:opacity-70"
                    >
                        {isUploading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            "+"
                        )}
                    </button>
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        disabled={disabled || isUploading}
                    />
                </div>
                {error && (
                    <div className="text-xs text-red-500 font-medium">{error}</div>
                )}
            </div>
        );
    }

    return (
        <div className="space-y-4 w-full">
            {error && (
                <div className="text-sm text-red-500 font-medium">{error}</div>
            )}

            <div className="flex flex-col items-center gap-4">
                {value ? (
                    <div className="relative w-40 h-40 rounded-full overflow-hidden border-2 border-gray-100 shadow-sm group">
                        <Image
                            src={value}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                onClick={handleRemove}
                                disabled={disabled}
                                className="h-8 w-8 rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={handleButtonClick}
                        className="w-40 h-40 rounded-full border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 hover:bg-gray-50 transition-colors"
                    >
                        <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500 font-medium text-center px-4">
                            {isUploading ? "Uploading..." : "Click to upload"}
                        </span>
                    </div>
                )}

                <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    disabled={disabled || isUploading}
                />

                <Button
                    type="button"
                    variant="outline"
                    onClick={handleButtonClick}
                    disabled={disabled || isUploading}
                    className="btn-polished"
                >
                    {isUploading ? (
                        "Uploading..."
                    ) : (
                        <>
                            <Upload className="h-4 w-4 mr-2" />
                            {value ? "Change Image" : label}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}
