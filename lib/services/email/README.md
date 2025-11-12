# Email Template System

This directory contains the modular email template system for Ouiimi.

## Structure

```
lib/services/email/
├── templates/
│   ├── index.ts          # Template registry and exports
│   ├── header.ts         # Email header component
│   ├── footer.ts         # Email footer component
│   ├── welcome.ts        # Welcome email template
│   ├── forget-password.ts # Password reset template
│   └── [new-template].ts # Add new templates here
└── README.md            # This file
```

## Adding a New Email Template

### Method 1: Using HTML File (Recommended for complex designs)

1. **Add HTML file** to `app/templetes/`:
   ```
   app/templetes/order-confirmation.html
   ```

2. **Create template function** in `lib/services/email/templates/order-confirmation.ts`:
   ```typescript
   import { readFileSync } from "fs";
   import { join } from "path";
   import { getEmailHeader } from "./header";
   import { getEmailFooter } from "./footer";

   export interface OrderConfirmationData {
     fname?: string;
     email: string;
     orderNumber: string;
     orderTotal: string;
   }

   export async function getOrderConfirmationTemplate(
     data: OrderConfirmationData
   ): Promise<string> {
     try {
       const templatePath = join(
         process.cwd(),
         "app",
         "templetes",
         "order-confirmation.html"
       );
       let template = readFileSync(templatePath, "utf-8");

       // Replace placeholders
       template = template.replace(/\[First Name\]/g, data.fname || "User");
       template = template.replace(/\[Order Number\]/g, data.orderNumber);
       template = template.replace(/\[Order Total\]/g, data.orderTotal);

       return template;
     } catch (error) {
       console.error("Error reading template:", error);
       return getFallbackTemplate(data);
     }
   }

   function getFallbackTemplate(data: OrderConfirmationData): string {
     // Fallback template if HTML file not found
     return `...`;
   }
   ```

3. **Register template** in `lib/services/email/templates/index.ts`:
   ```typescript
   import { getOrderConfirmationTemplate, type OrderConfirmationData } from "./order-confirmation";

   export type EmailTemplateType =
     | "welcome"
     | "forget_password"
     | "order_confirmation"  // Add here
     | ...;

   const templateMap: Record<...> = {
     // ... existing templates
     order_confirmation: (data) => getOrderConfirmationTemplate(data as OrderConfirmationData),
   };
   ```

4. **Add helper function** in `lib/services/mailjet.ts` (optional):
   ```typescript
   export async function sendOrderConfirmationEmail(
     email: string,
     fname: string,
     orderNumber: string,
     orderTotal: string
   ): Promise<boolean> {
     return sendEmail(
       [email],
       "Order Confirmation - Ouiimi",
       { fname, email, orderNumber, orderTotal },
       "order_confirmation"
     );
   }
   ```

### Method 2: Programmatic Template (For simple emails)

1. **Create template function** in `lib/services/email/templates/verify-email.ts`:
   ```typescript
   import { getEmailHeader } from "./header";
   import { getEmailFooter } from "./footer";

   export interface VerifyEmailData {
     fname?: string;
     email: string;
     verificationLink: string;
   }

   export function getVerifyEmailTemplate(data: VerifyEmailData): string {
     const header = getEmailHeader();
     const footer = getEmailFooter();

     return `
       <!DOCTYPE html>
       <html>
       <head>...</head>
       <body>
         ${header}
         <div class="content">
           <h2>Verify Your Email</h2>
           <p>Hi ${data.fname || "User"},</p>
           <p>Please verify your email by clicking the link below:</p>
           <a href="${data.verificationLink}">Verify Email</a>
         </div>
         ${footer}
       </body>
       </html>
     `;
   }
   ```

2. **Register in index.ts** (same as Method 1, step 3)

## Usage Examples

### Using Helper Functions (Recommended)
```typescript
import { sendWelcomeEmail, sendPasswordResetEmail } from "@/lib/services/mailjet";

// Send welcome email
await sendWelcomeEmail("user@example.com", "John");

// Send password reset
await sendPasswordResetEmail("user@example.com", "John", "https://...");
```

### Using Generic sendEmail Function
```typescript
import { sendEmail } from "@/lib/services/mailjet";

await sendEmail(
  ["user@example.com"],
  "Order Confirmation",
  {
    fname: "John",
    email: "user@example.com",
    orderNumber: "12345",
    orderTotal: "$99.99"
  },
  "order_confirmation"
);
```

## Template Placeholders

Common placeholders you can use in HTML templates:
- `[First Name]` or `[FIRST_NAME]` - User's first name
- `[EMAIL]` - User's email address
- `[Order Number]` - Order number (for order emails)
- `[Order Total]` - Order total (for order emails)
- `[Verification Link]` - Verification/reset link
- Add more as needed in your template functions

## Best Practices

1. **Always provide fallback templates** - If HTML file can't be read, use a programmatic fallback
2. **Use header and footer** - Import and use `getEmailHeader()` and `getEmailFooter()` for consistency
3. **Type your data** - Create TypeScript interfaces for each template's data
4. **Test templates** - Test with different data to ensure placeholders work
5. **Keep templates modular** - Each template in its own file for easy maintenance

## Template Files Location

- **HTML Templates**: `app/templetes/` (for complex HTML designs from Mailjet)
- **Template Functions**: `lib/services/email/templates/` (TypeScript functions)

