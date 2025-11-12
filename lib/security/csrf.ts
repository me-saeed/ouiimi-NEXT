import { randomBytes, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

const CSRF_SECRET = process.env.CSRF_SECRET || process.env.JWT_SECRET || "csrf-secret-key";

export function generateCSRFToken(): string {
  const token = randomBytes(32).toString("hex");
  const hmac = createHmac("sha256", CSRF_SECRET);
  hmac.update(token);
  const signature = hmac.digest("hex");
  return `${token}.${signature}`;
}

export function validateCSRFToken(token: string): boolean {
  if (!token || !token.includes(".")) {
    return false;
  }

  const [tokenPart, signature] = token.split(".");
  if (!tokenPart || !signature) {
    return false;
  }

  const hmac = createHmac("sha256", CSRF_SECRET);
  hmac.update(tokenPart);
  const expectedSignature = hmac.digest("hex");

  return signature === expectedSignature;
}

export function getCSRFTokenFromRequest(req: NextRequest): string | null {
  // Check header first (for API requests)
  const headerToken = req.headers.get("x-csrf-token");
  if (headerToken) {
    return headerToken;
  }

  // Check body (for form submissions)
  // Note: This requires parsing the body, which should be done in the route handler
  return null;
}

export function withCSRFProtection(
  handler: (req: NextRequest) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    // Skip CSRF for GET requests
    if (req.method === "GET") {
      return handler(req);
    }

    const token = getCSRFTokenFromRequest(req);
    if (!token || !validateCSRFToken(token)) {
      return NextResponse.json(
        { error: "Invalid CSRF token" },
        { status: 403 }
      );
    }

    return handler(req);
  };
}

