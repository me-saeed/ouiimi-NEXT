export interface BookingConfirmationEmailData {
  fname: string;
  email: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  totalCost: number;
  depositAmount: number;
  bookingId: string;
}

export function getBookingConfirmationEmailTemplate(
  data: BookingConfirmationEmailData
): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #EECFD1; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .booking-details { background-color: white; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="color: white; margin: 0;">Booking Confirmed!</h1>
        </div>
        <div class="content">
          <p>Hi ${data.fname},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div class="booking-details">
            <h3>Booking Details</h3>
            <p><strong>Business:</strong> ${data.businessName}</p>
            <p><strong>Service:</strong> ${data.serviceName}</p>
            <p><strong>Date:</strong> ${data.date}</p>
            <p><strong>Time:</strong> ${data.time}</p>
            <p><strong>Booking ID:</strong> ${data.bookingId}</p>
            <hr>
            <p><strong>Total Cost:</strong> $${data.totalCost.toFixed(2)}</p>
            <p><strong>Deposit Paid:</strong> $${data.depositAmount.toFixed(2)}</p>
            <p><strong>Remaining:</strong> $${(data.totalCost - data.depositAmount).toFixed(2)}</p>
          </div>
          
          <p>You can view and manage your bookings in your profile.</p>
        </div>
        <div class="footer">
          <p>Thank you for using ouiimi!</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

