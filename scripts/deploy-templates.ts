
try { require('dotenv').config({ path: '.env.local' }); } catch (e) { console.log('dotenv not loaded:', e); }
const Mailjet = require("node-mailjet");

const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;

if (!apiKey || !secretKey) {
  console.error("Missing MAILJET keys");
  process.exit(1);
}

const mailjet = Mailjet.Client.apiConnect(apiKey, secretKey);

// Shared CSS/Layout
const EMAIL_CSS = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; }
  .wrapper { width: 100%; background-color: #f6f9fc; padding: 40px 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; }
  .header { background-color: #EECFD1; padding: 30px; text-align: center; border-bottom: 3px solid #dca6aa; }
  .logo { font-size: 24px; font-weight: bold; color: #333; }
  .logo span { color: #ffffff; }
  .content { padding: 40px; }
  .h1 { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px; text-align: center; }
  .p { margin: 0 0 20px; color: #555555; font-size: 16px; }
  .card { background: #fcfcfc; border: 1px solid #eee; border-radius: 8px; padding: 25px; margin: 25px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; }
  .lbl { font-weight: 600; color: #888; font-size: 14px; text-transform: uppercase; }
  .val { font-weight: 500; color: #333; }
  .btn { display: inline-block; background: #EECFD1; color: #333; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 10px; }
  .footer { background: #000000; padding: 30px; text-align: center; color: #ffffff; font-size: 13px; }
  .footer p { color: #ffffff; opacity: 0.8; }
`;

function wrap(content: string, title: string) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${EMAIL_CSS}</style>
    </head>
    <body>
      <div class="wrapper">
        <div class="container">
          <div class="header"><div class="logo">ouiimi<span>.</span></div></div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            <p>&copy; 2024 ouiimi. All rights reserved.</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template Definitions (using Mailjet syntax)
const UPDATES = [
  {
    id: 7470194, // Welcome Shopper
    html: wrap(`
      <h1 class="h1">Welcome to Ouiimi!</h1>
      <p class="p">Hi {{var:fname:Friend}},</p>
      <p class="p">We are thrilled to have you join our community. <strong>Ouiimi</strong> connects you with the best local beauty and wellness services, effortlessly.</p>
      <p class="p">Explore top-rated professionals in your area and book your next appointment today.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/signin" class="btn">Explore Services</a>
      </div>
    `, "Welcome")
  },
  {
    id: 7579447, // Account Email Verification
    html: wrap(`
      <h1 class="h1">Verify Your Email Address</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Thank you for creating an account with Ouiimi. To ensure the security of your account, please verify your email address by clicking the button below.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="{{var:uniquelink}}" class="btn">Verify Email</a>
      </div>
      <p class="p" style="font-size: 12px; margin-top: 20px; color: #888;">This link will expire in 24 hours. If you did not create an account, please ignore this email.</p>
    `, "Verify Email")
  },
  {
    id: 7470222, // Business Welcome / Notification
    html: wrap(`
      <h1 class="h1">{{var:emailTitle:Welcome to Ouiimi Business}}</h1>
      <p class="p">Hi {{var:fname}},</p>
      <div style="white-space: pre-wrap;">{{var:emailBody:Congratulations on taking the next step for your business! We are excited to partner with you.}}</div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">Go to Dashboard</a>
      </div>
    `, "Notification")
  },
  {
    id: 7470249, // Business Approved
    html: wrap(`
      <h1 class="h1">Account Approved</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">We are pleased to inform you that your <strong>Ouiimi Business</strong> account has been approved!</p>
      <p class="p">Your services are now live and visible to shoppers on our platform. You can now manage your bookings and schedule directly from your dashboard.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">Manage Business</a>
      </div>
    `, "Approved")
  },
  {
    id: 7568667, // Booking Confirmation Shopper
    html: wrap(`
      <h1 class="h1">Booking Confirmed</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Your appointment with <strong>{{var:businessName}}</strong> has been successfully confirmed.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}}</span></div>
        <div class="row"><span class="lbl">Time</span><span class="val">{{var:startTime}} - {{var:endTime}}</span></div>
        <div class="row"><span class="lbl">Booking ID</span><span class="val">#{{var:bookingNumber}}</span></div>
        <div class="row"><span class="lbl">Address</span><span class="val">{{var:businessAddress}}</span></div>
      </div>
      <div class="card" style="background: #fff0f1;">
        <div class="row"><span class="lbl">Total Cost</span><span class="val">$ {{var:totalCost}}</span></div>
        <div class="row"><span class="lbl">Deposit Paid</span><span class="val">$ {{var:depositPaid}}</span></div>
        <div class="row"><span class="lbl">Amount Due</span><span class="val">$ {{var:remainingAmount}}</span></div>
      </div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/profile" class="btn">View Booking Details</a>
      </div>
    `, "Booking Confirmed")
  },
  {
    id: 7568585, // Booking Confirmation Business (Notification)
    html: wrap(`
      <h1 class="h1">{{var:emailTitle:New Booking Received}}</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">{{var:introText:You have received a new booking request.}}</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Customer</span><span class="val">{{var:customerName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}}</span></div>
        <div class="row"><span class="lbl">Time</span><span class="val">{{var:startTime}} - {{var:endTime}}</span></div>
        <div class="row"><span class="lbl">Total Value</span><span class="val">$ {{var:totalCost}}</span></div>
      </div>
      <p class="p">Please ensure you are prepared.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">View Dashboard</a>
      </div>
    `, "Notification")
  },
  {
    id: 7568563, // Appointment Reminder Shopper
    html: wrap(`
      <h1 class="h1">Appointment Reminder</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">This is a friendly reminder that you have an upcoming appointment tomorrow with <strong>{{var:businessName}}</strong>.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}} at {{var:time}}</span></div>
      </div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/profile" class="btn">View Details</a>
      </div>
    `, "Reminder")
  },
  {
    id: 7568493, // Booking Complete Shopper
    html: wrap(`
      <h1 class="h1">Service Completed</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Your service with <strong>{{var:businessName}}</strong> has been marked as completed.</p>
      <p class="p">We hope you enjoyed your experience! Please take a moment to leave a review and let others know about your service.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/profile" class="btn">Leave a Review</a>
      </div>
    `, "Completed")
  },
  {
    id: 7568471, // Payment Receipt Small Business
    html: wrap(`
      <h1 class="h1">Payment Released</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Good news! A payment of <strong>$ {{var:amountReleased}}</strong> has been released to your account.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Customer</span><span class="val">{{var:customerName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:releaseDate}}</span></div>
      </div>
      <p class="p">The funds should appear in your connected account shortly.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">View Dashboard</a>
      </div>
    `, "Receipt")
  },
  {
    id: 7469418, // Forgot Password
    html: wrap(`
      <h1 class="h1">Reset Your Password</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">We received a request to reset your password. If you made this request, please click the button below to proceed.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="{{var:uniquelink}}" class="btn">Reset Password</a>
      </div>
      <p class="p" style="font-size: 12px; margin-top: 20px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    `, "Reset Password")
  },
  {
    id: 7579254, // Booking Cancelled (Shopper) - Premium
    html: wrap(`
      <h1 class="h1">Booking Cancelled</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Your booking with <strong>{{var:businessName}}</strong> has been cancelled.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}} at {{var:time}}</span></div>
        <div class="row"><span class="lbl">Booking ID</span><span class="val">#{{var:bookingNumber}}</span></div>
         <div class="row"><span class="lbl">Refund Amount</span><span class="val">$ {{var:refundAmount}}</span></div>
      </div>
      <p class="p">If you have any questions or believe this is an error, please contact support.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com" class="btn">Book New Service</a>
      </div>
    `, "Booking Cancelled")
  },
  {
    id: 7579485, // Booking Cancelled by Shopper (to Business)
    html: wrap(`
        <h1 class="h1">Booking Cancelled</h1>
        <p class="p">Hi {{var:fname}},</p>
        <p class="p">A booking for <strong>{{var:serviceName}}</strong> has been cancelled by the customer.</p>
        <div class="card">
          <div class="row"><span class="lbl">Customer</span><span class="val">{{var:customerName}}</span></div>
          <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}} at {{var:startTime}}</span></div>
          <div class="row"><span class="lbl">Booking ID</span><span class="val">#{{var:bookingNumber}}</span></div>
        </div>
        <p class="p">Your calendar has been updated automatically.</p>
        <div style="text-align: center; margin-top: 35px;">
          <a href="https://ouiimi.com/business/dashboard" class="btn">View Dashboard</a>
        </div>
      `, "Booking Cancelled")
  }
];

async function deploy() {
  for (const update of UPDATES) {
    try {
      console.log(`Updating Template ${update.id}...`);
      await mailjet.put(`template/${update.id}/detailcontent`).request({
        "Html-part": update.html
      });
      console.log("Success.");
    } catch (e: any) {
      if (e.statusCode === 404) {
        console.log(`404 on PUT, retrying with POST for ${update.id}...`);
        try {
          await mailjet.post(`template/${update.id}/detailcontent`).request({
            "Html-part": update.html
          });
          console.log("Success (POST).");
        } catch (e2: any) {
          console.error(`Failed ${update.id} (POST):`, e2.message);
        }
      } else {
        console.error(`Failed ${update.id}:`, e.message);
      }
    }
  }
}

deploy();
