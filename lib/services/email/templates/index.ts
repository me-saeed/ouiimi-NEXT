/**
 * Email Templates Registry
 * 
 * To add a new email template:
 * 1. Create a new file in this directory (e.g., order-confirmation.ts)
 * 2. Export a function that returns the HTML string
 * 3. Add it to the EmailTemplateType and templateMap below
 */

import { getWelcomeEmailTemplate, type WelcomeEmailData } from "./welcome";
import {
  getForgetPasswordEmailTemplate,
  type ForgetPasswordEmailData,
} from "./forget-password";

export type EmailTemplateType =
  | "welcome"
  | "forget_password"
  | "verify_email"
  | "order_confirmation"
  | "order_shipped"
  | "order_complete";

export interface EmailTemplateData {
  fname?: string;
  email: string;
  uniquelink?: string;
  [key: string]: any;
}

// Template registry - maps template type to template function
const templateMap: Record<
  EmailTemplateType,
  (data: EmailTemplateData) => Promise<string> | string
> = {
  welcome: (data) => getWelcomeEmailTemplate(data as WelcomeEmailData),
  forget_password: (data) =>
    getForgetPasswordEmailTemplate(data as ForgetPasswordEmailData),
  verify_email: (data) => {
    // TODO: Implement verify email template
    return Promise.resolve(`<p>Verify your email: ${data.uniquelink}</p>`);
  },
  order_confirmation: (data) => {
    // TODO: Implement order confirmation template
    return Promise.resolve(`<p>Order confirmed for ${data.fname}</p>`);
  },
  order_shipped: (data) => {
    // TODO: Implement order shipped template
    return Promise.resolve(`<p>Your order has been shipped!</p>`);
  },
  order_complete: (data) => {
    // TODO: Implement order complete template
    return Promise.resolve(`<p>Your order is complete!</p>`);
  },
};

export async function getEmailTemplate(
  templateType: EmailTemplateType,
  data: EmailTemplateData
): Promise<string> {
  const templateFunction = templateMap[templateType];

  if (!templateFunction) {
    throw new Error(`Email template "${templateType}" not found`);
  }

  const result = templateFunction(data);
  return result instanceof Promise ? await result : result;
}

// Export types for use in other files
export type { WelcomeEmailData, ForgetPasswordEmailData };

