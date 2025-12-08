import jwt, { SignOptions } from "jsonwebtoken";

const JWT_SECRET: string = process.env.JWT_SECRET as string;
const JWT_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  throw new Error(
    "Please define the JWT_SECRET environment variable inside .env.local"
  );
}

export interface JWTPayload {
  userId: string;
  email: string;
  username?: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function getTokenFromRequest(req: Request | { headers: Headers | { get: (key: string) => string | null } }): string | null {
  const headers = 'headers' in req ? req.headers : (req as Request).headers;
  const authHeader = headers.get ? headers.get("authorization") : (headers as any).get("authorization");
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return null;
}

