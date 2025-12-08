import { randomBytes, createHmac } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Use JWT_SECRET for CSRF to ensure consistency
function getCSRFSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.CSRF_SECRET;
  if (!secret) {
    throw new Error(
      "Please define the JWT_SECRET or CSRF_SECRET environment variable inside .env.local"
    );
  }
  return secret;
}

export function generateCSRFToken(): string {
  const token = randomBytes(32).toString("hex");
  const hmac = createHmac("sha256", getCSRFSecret());
  hmac.update(token);
  const signature = hmac.digest("hex");
  return `${token}.${signature}`;
}

export function validateCSRFToken(token: string): boolean {
  if (!token || !token.includes(".")) {
    console.error("CSRF token validation: Token missing or invalid format");
    return false;
  }

  const [tokenPart, signature] = token.split(".");
  if (!tokenPart || !signature) {
    console.error("CSRF token validation: Token parts missing");
    return false;
  }

  const hmac = createHmac("sha256", getCSRFSecret());
  hmac.update(tokenPart);
  const expectedSignature = hmac.digest("hex");

  const isValid = signature === expectedSignature;
  if (!isValid) {
    console.error("CSRF token validation: Signature mismatch");
    console.error("Token part length:", tokenPart.length);
  }

  return isValid;
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

