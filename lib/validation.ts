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

// Business Validation Schemas
export const businessCreateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  story: z.string().optional(),
});

export const businessUpdateSchema = z.object({
  businessName: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().min(5).optional(),
  logo: z.string().optional(),
  story: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

export const bankDetailsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bsb: z.string().min(6, "BSB must be at least 6 characters"),
  accountNumber: z.string().min(6, "Account number is required"),
  contactNumber: z.string().optional(),
});

// Staff Validation Schemas
export const staffCreateSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  photo: z.string().optional(),
  qualifications: z.string().optional(),
  about: z.string().optional(),
});

export const staffUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  photo: z.string().optional(),
  qualifications: z.string().optional(),
  about: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Service Validation Schemas
export const timeSlotSchema = z.object({
  date: z.string().or(z.date()),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  cost: z.number().min(0).optional(),
  staffIds: z.array(z.string()).optional(),
});

export const addOnSchema = z.object({
  name: z.string().min(1, "Add-on name is required"),
  cost: z.number().min(0, "Cost must be 0 or greater"),
});

export const serviceCreateSchema = z.object({
  businessId: z.string().min(1, "Business ID is required"),
  category: z.string().min(1, "Category is required"),
  subCategory: z.string().optional(),
  serviceName: z.string().min(1, "Service name is required"),
  duration: z.string().min(1, "Duration is required"),
  baseCost: z.number().min(0, "Base cost must be 0 or greater"),
  description: z.string().optional(),
  address: z.string().min(5, "Address is required"),
  addOns: z.array(addOnSchema).optional(),
  timeSlots: z.array(timeSlotSchema).optional(),
});

export const serviceUpdateSchema = z.object({
  category: z.string().optional(),
  subCategory: z.string().optional(),
  serviceName: z.string().optional(),
  duration: z.string().optional(),
  baseCost: z.number().min(0).optional(),
  description: z.string().optional(),
  address: z.string().min(5).optional(),
  addOns: z.array(addOnSchema).optional(),
  status: z.enum(["listed", "booked", "completed", "cancelled"]).optional(),
});

export type BusinessCreateInput = z.infer<typeof businessCreateSchema>;
export type BusinessUpdateInput = z.infer<typeof businessUpdateSchema>;
export type BankDetailsInput = z.infer<typeof bankDetailsSchema>;
export type StaffCreateInput = z.infer<typeof staffCreateSchema>;
export type StaffUpdateInput = z.infer<typeof staffUpdateSchema>;
export type ServiceCreateInput = z.infer<typeof serviceCreateSchema>;
export type ServiceUpdateInput = z.infer<typeof serviceUpdateSchema>;
export type TimeSlotInput = z.infer<typeof timeSlotSchema>;
export type AddOnInput = z.infer<typeof addOnSchema>;

