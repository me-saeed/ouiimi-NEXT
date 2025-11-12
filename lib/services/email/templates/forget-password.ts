import { getEmailHeader } from "./header";
import { getEmailFooter } from "./footer";

export interface ForgetPasswordEmailData {
  fname?: string;
  email: string;
  uniquelink: string;
}

export function getForgetPasswordEmailTemplate(
  data: ForgetPasswordEmailData
): string {
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
        .content { background-color: #f8f8f8; padding: 30px; }
        .button { display: inline-block; background-color: #FF8439; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        ${header}
        <div class="content">
          <h2>Password Reset Request</h2>
          <p>Hi ${data.fname || "User"},</p>
          <p>You have requested to update the password. Here is the verification link - it's only valid for 15 minutes. Be quick!</p>
          <p style="text-align: center;">
            <a href="${data.uniquelink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #FF8439;">${data.uniquelink}</p>
          <p>If you did not request this password reset, please ignore this email.</p>
          <p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;line-height:107%;font-size:15px;font-family:"Calibri",sans-serif;text-align:center;'>
            Remember when you shop with us, you are supporting and keeping small business doors open.
          </p>
          <p style='margin-top:0in;margin-right:0in;margin-bottom:8.0pt;margin-left:0in;line-height:107%;font-size:15px;font-family:"Calibri",sans-serif;text-align:center;'>
            <a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}">${process.env.NEXTAUTH_URL || "http://localhost:3000"}</a>
          </p>
        </div>
        ${footer}
      </div>
    </body>
    </html>
  `;
}

