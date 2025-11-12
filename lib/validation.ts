import { z } from "zod";

export const signupSchema = z.object({
  fname: z.string().min(3, "First name must be at least 3 characters"),
  lname: z.string().min(3, "Last name must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  address: z.string().optional(),
  contactNo: z.string().optional(),
});

export const signinSchema = z.object({
  username: z.string().min(3, "Username or email is required"),
  password: z.string().min(8, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

// Schema for form validation (only password fields)
export const resetPasswordFormSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Schema for API validation (includes email and token)
export const resetPasswordSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    token: z.string().min(1, "Token is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

