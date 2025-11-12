import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/security/csrf";

export async function GET(req: NextRequest) {
  try {
    const token = generateCSRFToken();
    
    // Verify token was generated
    if (!token || !token.includes(".")) {
      console.error("Failed to generate CSRF token");
      return NextResponse.json(
        { error: "Failed to generate CSRF token" },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ csrfToken: token });
  } catch (error) {
    console.error("Error generating CSRF token:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
}

