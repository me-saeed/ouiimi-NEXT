import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { join } from "path";

// ✅ Configure route for file uploads
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Note: In App Router, body size limits are configured in next.config.js
// We don't need the deprecated 'config' export here

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
        // Path: /public/images (accessible as /images/filename.jpg)
        const relativeUploadDir = "/images";
        const uploadDir = join(process.cwd(), "public", "images");

        console.log(`[Upload] Creating directory: ${uploadDir}`);

        try {
            await mkdir(uploadDir, { recursive: true });
            console.log(`[Upload] Directory created/verified: ${uploadDir}`);
        } catch (mkdirError: any) {
            console.error("[Upload] Error creating upload directory:", mkdirError);
            console.error("[Upload] Directory path:", uploadDir);
            console.error("[Upload] Error code:", mkdirError.code);
            // Continue anyway - directory might already exist
        }

        const filePath = join(uploadDir, filename);

        console.log(`[Upload] Writing file: ${filePath}`);

        // Write file
        await writeFile(filePath, buffer);

        console.log(`[Upload] File written successfully: ${filename}`);

        // Return public URL (relative path that works in browser)
        const fileUrl = `${relativeUploadDir}/${filename}`;

        return NextResponse.json({ url: fileUrl, success: true });
    } catch (error: any) {
        console.error("[Upload] Upload error:", error);
        console.error("[Upload] Error message:", error.message);
        console.error("[Upload] Error stack:", error.stack);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
};
