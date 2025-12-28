/**
 * Base Email Template
 * Provides consistent header, footer, and HTML structure for all emails
 */

/**
 * Generate email header with pink background and ouiimi logo
 */
export function getEmailHeader(): string {
    return `
    <div style="background-color: #EECFD1; padding: 40px 20px; text-align: center;">
      <h1 style="margin: 0; font-family: 'Didot', 'Bodoni MT', 'Noto Serif Display', serif; font-size: 48px; color: white; font-weight: 400; letter-spacing: 2px;">
        ouiimi
      </h1>
    </div>
  `;
}

/**
 * Generate email footer with dark background and contact info
 */
export function getEmailFooter(): string {
    return `
    <div style="background-color: #4A4A4A; padding: 30px 20px; text-align: center; color: white;">
      <p style="margin: 0 0 8px 0; font-family: 'Didot', 'Bodoni MT', 'Noto Serif Display', serif; font-size: 20px; font-weight: 400; letter-spacing: 1px;">
        ouiimi
      </p>
      <p style="margin: 4px 0; font-size: 14px; color: white;">
        Richmond Vic, 3121
      </p>
      <p style="margin: 4px 0; font-size: 14px; color: white;">
        information@ouiimi.com
      </p>
      <p style="margin: 4px 0; font-size: 14px; color: white;">
        0466006171
      </p>
    </div>
  `;
}

/**
 * Wrap email content with base HTML structure, header, and footer
 */
export function wrapEmailContent(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <title>ouiimi</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: white;
    }
    .content {
      padding: 40px 30px;
      text-align: center;
    }
    .heading {
      font-size: 18px;
      font-weight: 600;
      color: #1F1F1F;
      text-align: center;
      margin: 0 0 16px 0;
      line-height: 1.4;
    }
    .body-text {
      font-size: 14px;
      color: #999999;
      line-height: 1.6;
      text-align: center;
      margin: 12px 0;
    }
    .section-label {
      font-size: 14px;
      color: #999999;
      text-decoration: underline;
      margin: 20px 0 12px 0;
    }
    .detail-row {
      font-size: 14px;
      color: #999999;
      margin: 8px 0;
      line-height: 1.6;
    }
    .closing {
      font-size: 14px;
      color: #999999;
      text-align: center;
      margin-top: 32px;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="email-container">
    ${getEmailHeader()}
    <div class="content">
      ${content}
    </div>
    ${getEmailFooter()}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Helper: Format detail row
 */
export function formatDetailRow(label: string, value: string): string {
    return `<p class="detail-row">${label}: ${value}</p>`;
}

/**
 * Helper: Format closing
 */
export function formatClosing(text: string = "Warm regards,<br>The ouiimi Team"): string {
    return `<p class="closing">${text}</p>`;
}
