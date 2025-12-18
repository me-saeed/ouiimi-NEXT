import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// ✅ Disable body parsing for manual handling if needed, though Next.js handles formData automatically
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = async (req: NextRequest) => {
    try {
        // Define upload directory (NOT in /public)
        const uploadDir = path.join(process.cwd(), "uploads");

        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
            console.log(`[Upload] Created directory: ${uploadDir}`);
        }

        // Use standard Next.js formData handling
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { error: "No file uploaded" },
                { status: 400 }
            );
        }

        // Validate file size (5MB limit)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds 5MB limit" },
                { status: 400 }
            );
        }

        // Get file buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
        const filename = `${Date.now()}-${originalName}`;
        const filePath = path.join(uploadDir, filename);

        // Write file to uploads directory
        fs.writeFileSync(filePath, buffer);

        console.log(`[Upload] File saved: ${filename}`);
        console.log(`[Upload] Path: ${filePath}`);

        // Return URL that points to serving route
        const url = `/api/images/${filename}`;

        return NextResponse.json({
            filename,
            url,
            success: true
        });

    } catch (error: any) {
        console.error("[Upload] Upload error:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
};
