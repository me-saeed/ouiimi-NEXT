/**
 * Mailjet Email Service
 * Uses Mailjet template IDs for sending emails
 */

let mailjet: any = null;

function getMailjetClient() {
  if (typeof window !== "undefined") {
    throw new Error("Mailjet service can only be used on the server side");
  }

  if (!mailjet) {
    const apiKey = process.env.MAILJET_API_KEY;
    const secretKey = process.env.MAILJET_SECRET_KEY;

    if (!apiKey || !secretKey) {
      console.warn("MAILJET_API_KEY and MAILJET_SECRET_KEY not configured.");
      return null;
    }

    const Mailjet = require("node-mailjet");
    mailjet = Mailjet.Client.apiConnect(apiKey, secretKey);
  }
  return mailjet;
}

export interface EmailData {
  fname?: string;
  lname?: string;
  email: string;
  uniquelink?: string;
  businessName?: string;
  serviceName?: string;
  date?: string;
  time?: string;
  totalCost?: number;
  depositAmount?: number;
  paymentAmount?: number;
  cancelledBy?: string;
  [key: string]: any;
}

// Mailjet Template IDs
const TEMPLATE_IDS = {
  welcome: 7470194,                           // "welcome Email"
  business_welcome: 7470222,                  // "Business Signup Welcome Email"
  business_approved: 7470249,                 // "business Approved"
  booking_confirmation_shopper: 7568667,      // "Booking Confirmation (Shopper)"
  booking_confirmation_business: 7568585,     // "Booking Confirmation (business)"
  appointment_reminder: 7568563,              // "Appointment Reminder (Shopper)"
  booking_complete: 7568493,                  // "Booking Complete (shopper)"
  payment_receipt: 7568471,                   // "Payment Receipt (small business)"
  booking_cancellation: 7568667,             // Using booking confirmation template
  forgot_password: 7469418,                   // "My templte" - placeholder
} as const;

export type EmailTemplateType = keyof typeof TEMPLATE_IDS;

/**
 * Send email using Mailjet template
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

    const templateId = TEMPLATE_IDS[templateType];
    const recipients = emailToSend.map((email) => ({
      Email: email,
      Name: data.fname || "",
    }));

    const request = mailjetClient.post("send", { version: "v3.1" }).request({
      Messages: [
        {
          From: {
            Email: process.env.MAILJET_FROM_EMAIL || "information@ouiimi.com",
            Name: process.env.MAILJET_FROM_NAME || "Ouiimi",
          },
          To: recipients,
          TemplateID: templateId,
          TemplateLanguage: true,
          Subject: subject,
          Variables: data,
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
 * Send welcome email to shopper
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
 * Send business welcome email
 */
export async function sendBusinessWelcomeEmail(
  email: string,
  fname: string,
  businessName: string
): Promise<boolean> {
  return sendEmail(
    [email],
    "Welcome to Ouiimi - Business Account Created",
    { fname, email, businessName },
    "business_welcome"
  );
}

/**
 * Send password reset email
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
    "forgot_password"
  );
}

/**
 * Send booking confirmation to shopper
 */
export async function sendBookingConfirmationToShopper(
  email: string,
  fname: string,
  data: {
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    totalCost: number;
    depositAmount: number;
  }
): Promise<boolean> {
  return sendEmail(
    [email],
    "Booking Confirmed - Ouiimi",
    { fname, email, ...data },
    "booking_confirmation_shopper"
  );
}

/**
 * Send booking confirmation to business
 */
export async function sendBookingConfirmationToBusiness(
  email: string,
  fname: string,
  data: {
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
    customerName: string;
  }
): Promise<boolean> {
  return sendEmail(
    [email],
    "New Booking Received - Ouiimi",
    { fname, email, ...data },
    "booking_confirmation_business"
  );
}

/**
 * Send appointment reminder
 */
export async function sendAppointmentReminder(
  email: string,
  fname: string,
  data: {
    businessName: string;
    serviceName: string;
    date: string;
    time: string;
  }
): Promise<boolean> {
  return sendEmail(
    [email],
    "Appointment Reminder - Ouiimi",
    { fname, email, ...data },
    "appointment_reminder"
  );
}

/**
 * Send booking completion email
 */
export async function sendBookingCompletionEmail(
  email: string,
  fname: string,
  data: {
    businessName: string;
    serviceName: string;
    date: string;
    totalCost: number;
    paymentAmount: number;
  }
): Promise<boolean> {
  return sendEmail(
    [email],
    "Service Completed - Ouiimi",
    { fname, email, ...data },
    "booking_complete"
  );
}

/**
 * Send payment receipt to business
 */
export async function sendPaymentReceiptToBusiness(
  email: string,
  fname: string,
  data: {
    businessName: string;
    serviceName: string;
    date: string;
    paymentAmount: number;
  }
): Promise<boolean> {
  return sendEmail(
    [email],
    "Payment Received - Ouiimi",
    { fname, email, ...data },
    "payment_receipt"
  );
}
