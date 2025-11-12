import { NextRequest, NextResponse } from "next/server";
import { generateCSRFToken } from "@/lib/security/csrf";

export async function GET(req: NextRequest) {
  const token = generateCSRFToken();
  return NextResponse.json({ csrfToken: token });
}

