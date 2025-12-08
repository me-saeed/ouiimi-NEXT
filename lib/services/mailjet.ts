/**
 * Mailjet Email Service
 * 
 * This service handles all email sending through Mailjet.
 * It uses a modular template system for easy maintenance and extension.
 */

// Dynamic import to avoid bundling issues in Next.js
let mailjet: any = null;

function getMailjetClient() {
  // Only load on server side
  if (typeof window !== "undefined") {
    throw new Error("Mailjet service can only be used on the server side");
  }
  
  if (!mailjet) {
    // Validate environment variables (only when actually sending email, not during build)
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;
    
    if (!apiKey || !secretKey) {
      console.warn("MAILJET_API_KEY and MAILJET_SECRET_KEY not configured. Email functionality will not work.");
      // Return a mock client during build, will throw at runtime if actually used
      return null;
    }
    
    // Use the modern node-mailjet v6 API
    const Mailjet = require("node-mailjet");
    mailjet = Mailjet.Client.apiConnect(apiKey, secretKey);
  }
  return mailjet;
}

export interface EmailData {
  fname?: string;
  email: string;
  uniquelink?: string;
  [key: string]: any;
}

export type EmailTemplateType =
  | "welcome"
  | "forget_password"
  | "verify_email"
  | "order_confirmation"
  | "order_shipped"
  | "order_complete"
  | "booking_confirmation"
  | "booking_cancellation"
  | "booking_completion";

/**
 * Send email using Mailjet
 * 
 * @param emailToSend - Array of email addresses to send to
 * @param subject - Email subject
 * @param data - Data object for template placeholders
 * @param templateType - Type of email template to use
 * @returns Promise<boolean> - true if email sent successfully
 */
export async function sendEmail(
  emailToSend: string[],
  subject: string,
  data: EmailData,
  templateType: EmailTemplateType
): Promise<boolean> {
  try {
    const mailjetClient = getMailjetClient();
    
    if (!mailjetClient) {
      console.error("Mailjet client not configured. Cannot send email.");
      return false;
    }

    // Import template dynamically
    const { getEmailTemplate } = await import("./email/templates");
    const htmlContent = await getEmailTemplate(templateType, data);

    const recipients = emailToSend.map((email) => ({ Email: email }));
    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || "information@ouiimi.com",
            Name: process.env.MAILJET_FROM_NAME || "Ouiimi",
          },
          To: recipients,
          Subject: subject,
          HTMLPart: htmlContent,
          CustomID: "OuiimiEmail",
        },
      ],
    });

    const response = await request;
    console.log("Email sent successfully:", response.body);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

/**
 * Helper function to send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  fname: string
): Promise<boolean> {
  return sendEmail(
    [email],
    "Welcome to Ouiimi",
    { fname, email },
    "welcome"
  );
}

/**
 * Helper function to send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  fname: string,
  resetLink: string
): Promise<boolean> {
  return sendEmail(
    [email],
    "Password Reset Request - Ouiimi",
    { fname, email, uniquelink: resetLink },
    "forget_password"
  );
}
