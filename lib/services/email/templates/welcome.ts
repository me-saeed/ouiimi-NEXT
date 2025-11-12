import { getEmailHeader } from "./header";
import { getEmailFooter } from "./footer";
import { readFileSync } from "fs";
import { join } from "path";

export interface WelcomeEmailData {
  fname?: string;
  email: string;
}

export async function getWelcomeEmailTemplate(
  data: WelcomeEmailData
): Promise<string> {
  try {
    // Try to read HTML template file
    const templatePath = join(
      process.cwd(),
      "app",
      "templetes",
      "welcome Email.html"
    );
    let template = readFileSync(templatePath, "utf-8");

    // Replace placeholders
    template = template.replace(/\[First Name\]/g, data.fname || "User");
    template = template.replace(/\[FIRST_NAME\]/g, data.fname || "User");
    template = template.replace(/\[EMAIL\]/g, data.email);

    return template;
  } catch (error) {
    console.error("Error reading welcome email template:", error);
    // Fallback to programmatic template
    return getFallbackWelcomeTemplate(data);
  }
}

function getFallbackWelcomeTemplate(data: WelcomeEmailData): string {
  const header = getEmailHeader();
  const footer = getEmailFooter();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #77dd77; color: white; padding: 20px; text-align: center; }
        .content { background-color: #f8f8f8; padding: 30px; }
        .button { display: inline-block; background-color: #FF8439; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { background-color: #2C2D28; color: white; padding: 20px; text-align: center; }
      </style>
    </head>
    <body>
      <div class="container">
        ${header}
        <div class="content">
          <h2>Welcome ${data.fname || "User"}!</h2>
          <p>Thank you for joining ouiimi — an easier way to discover, book, and manage everyday services.</p>
          <p>From salons and nails to massage and dog grooming — we're building a place that helps you spend less time searching and more time enjoying.</p>
          <p>You can log in anytime to manage bookings, track appointments, or explore new services in your area.</p>
          <p style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/signin" class="button">Get Started</a>
          </p>
        </div>
        ${footer}
      </div>
    </body>
    </html>
  `;
}

