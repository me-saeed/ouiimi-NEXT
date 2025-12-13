import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";

// 5MB limit handled by client check, but server should ideally check too
// Next.js body size limit might need config if files are huge, but 5MB is standard

export const POST = async (req: NextRequest) => {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        // sanitize filename
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${originalName}`;

        // Ensure uploads directory exists
        // Path: /public/uploads
        const relativeUploadDir = "/images";
        const uploadDir = join(process.cwd(), "public", relativeUploadDir);

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            console.error("Error creating upload directory:", e);
        }

        const filePath = join(uploadDir, filename);

        // Write file
        await writeFile(filePath, buffer);

        // Return public URL
        const fileUrl = `${relativeUploadDir}/${filename}`;

        return NextResponse.json({ url: fileUrl, success: true });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
};
