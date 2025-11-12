// Mock CSRF validation FIRST, before any imports
const mockValidateCSRFToken = jest.fn((token: string) => {
  return !!token && token.length > 0;
});

jest.mock("@/lib/security/csrf", () => {
  const originalModule = jest.requireActual("@/lib/security/csrf");
  return {
    ...originalModule,
    validateCSRFToken: mockValidateCSRFToken,
  };
});

// Mock mailjet service
jest.mock("@/lib/services/mailjet", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
}));

import { POST } from "@/app/api/auth/signup/route";
import { NextRequest } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";

describe("/api/auth/signup", () => {
  beforeAll(async () => {
    await dbConnect();
  });

  beforeEach(async () => {
    await User.deleteMany({ email: /test|example/ });
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it("should create a new user successfully", async () => {
    const requestBody = {
      fname: "Test",
      lname: "User",
      email: "test@example.com",
      username: "testuser",
      password: "password123",
      address: "123 Test St",
      contactNo: "1234567890",
    };

    const { generateCSRFToken } = await import("@/lib/security/csrf");
    const csrfToken = generateCSRFToken();

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("User created successfully");
    expect(data.user).toHaveProperty("email", "test@example.com");
    expect(data.user).toHaveProperty("token");
    expect(data.user).not.toHaveProperty("password");
  });

  it("should reject signup with invalid email", async () => {
    const requestBody = {
      fname: "Test",
      lname: "User",
      email: "invalid-email",
      username: "testuser2",
      password: "password123",
    };

    const { generateCSRFToken } = await import("@/lib/security/csrf");
    const csrfToken = generateCSRFToken();

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });

  it("should reject signup with existing email", async () => {
    await User.create({
      fname: "Existing",
      lname: "User",
      email: "existing@example.com",
      username: "existinguser",
      password: "hashedpassword",
      counterId: 1,
    });

    const requestBody = {
      fname: "Test",
      lname: "User",
      email: "existing@example.com",
      username: "newuser",
      password: "password123",
    };

    const { generateCSRFToken } = await import("@/lib/security/csrf");
    const csrfToken = generateCSRFToken();

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("already exists");
  });

  it("should reject signup without CSRF token", async () => {
    const requestBody = {
      fname: "Test",
      lname: "User",
      email: "test2@example.com",
      username: "testuser3",
      password: "password123",
    };

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Invalid CSRF token");
  });

  it("should reject signup with short password", async () => {
    const requestBody = {
      fname: "Test",
      lname: "User",
      email: "test3@example.com",
      username: "testuser4",
      password: "short",
    };

    const { generateCSRFToken } = await import("@/lib/security/csrf");
    const csrfToken = generateCSRFToken();

    const request = new NextRequest("http://localhost:3000/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-csrf-token": csrfToken,
      },
      body: JSON.stringify(requestBody),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation error");
  });
});
