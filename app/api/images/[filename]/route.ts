import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Configure route
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    req: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const { filename } = params;

        // Security: Prevent path traversal attacks
        const sanitizedFilename = path.basename(filename);

        if (sanitizedFilename !== filename) {
            return NextResponse.json(
                { error: "Invalid filename" },
                { status: 400 }
            );
        }

        // Get file path from uploads directory
        const filePath = path.join(process.cwd(), "uploads", sanitizedFilename);

        // Check if file exists
        if (!fs.existsSync(filePath)) {
            console.error(`[Image Serve] File not found: ${filePath}`);
            return NextResponse.json(
                { error: "File not found" },
                { status: 404 }
            );
        }

        // Read file
        const fileBuffer = fs.readFileSync(filePath);

        // Determine content type based on file extension
        const ext = path.extname(sanitizedFilename).toLowerCase();
        const contentTypeMap: Record<string, string> = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
            '.svg': 'image/svg+xml',
        };

        const contentType = contentTypeMap[ext] || 'application/octet-stream';

        // Return image with proper headers
        return new NextResponse(fileBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error: any) {
        console.error("[Image Serve] Error serving image:", error);
        return NextResponse.json(
            { error: "Internal Server Error", details: error.message },
            { status: 500 }
        );
    }
}
