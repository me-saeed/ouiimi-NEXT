// Mock CSRF validation for tests
export function validateCSRFToken(token: string): boolean {
  // In tests, accept any token that starts with "test-" or is not empty
  return token ? (token.startsWith("test-") || token.length > 0) : false;
}

export function generateCSRFToken(): string {
  return "test-csrf-token";
}

export function getCSRFTokenFromRequest(req: any): string | null {
  return req.headers?.get?.("x-csrf-token") || null;
}

export function withCSRFProtection(handler: any) {
  return handler;
}

