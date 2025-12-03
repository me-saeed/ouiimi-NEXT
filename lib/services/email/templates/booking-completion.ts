export interface BookingCompletionEmailData {
  fname: string;
  email: string;
  businessName: string;
  serviceName: string;
  date: string;
  totalCost: number;
  paymentAmount: number;
}

export function getBookingCompletionEmailTemplate(
  data: BookingCompletionEmailData
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #28a745; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .booking-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white; margin: 0;">Service Completed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.fname},</p>
          <p>Your service has been completed. Thank you for using ouiimi!</p>
          
          <div class="booking-details">
            <h3>Completed Service</h3>
            <p><strong>Business:</strong> ${data.businessName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <hr>
            <p><strong>Total Paid:</strong> $${data.totalCost.toFixed(2)}</p>
          </div>
          
          <p>We hope you had a great experience. You can leave a review or book again!</p>
        </div>
        <div class="footer">
          <p>Thank you for using ouiimi!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

