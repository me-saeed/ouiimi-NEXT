
try { require('dotenv').config(); } catch (e) { }
const Mailjet = require("node-mailjet");

const apiKey = process.env.MAILJET_API_KEY;
const secretKey = process.env.MAILJET_SECRET_KEY;

if (!apiKey || !secretKey) {
    console.error("Missing MAILJET keys");
    process.exit(1);
}

const mailjet = Mailjet.Client.apiConnect(apiKey, secretKey);

// Shared CSS/Layout
const CSS = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333333; margin: 0; padding: 0; }
  .wrapper { width: 100%; background-color: #f6f9fc; padding: 40px 0; }
  .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; }
  .header { background-color: #ffffff; padding: 30px; text-align: center; border-bottom: 3px solid #EECFD1; }
  .logo { font-size: 24px; font-weight: bold; color: #333; }
  .logo span { color: #EECFD1; }
  .content { padding: 40px; }
  .h1 { color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 20px; text-align: center; }
  .p { margin: 0 0 20px; color: #555555; font-size: 16px; }
  .card { background: #fcfcfc; border: 1px solid #eee; border-radius: 8px; padding: 25px; margin: 25px 0; }
  .row { display: flex; justify-content: space-between; margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; }
  .lbl { font-weight: 600; color: #888; font-size: 14px; text-transform: uppercase; }
  .val { font-weight: 500; color: #333; }
  .btn { display: inline-block; background: #EECFD1; color: #333; padding: 14px 30px; text-decoration: none; border-radius: 30px; font-weight: 600; margin-top: 10px; }
  .footer { background: #f6f9fc; padding: 30px; text-align: center; color: #888; font-size: 13px; }
`;

function wrap(content: string, title: string) {
    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>${CSS}</style>
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
      <h1 class="h1">Welcome, {{var:fname:Friend}}!</h1>
      <p class="p">We're thrilled to have you join <strong>ouiimi</strong>.</p>
      <p class="p">Discover and book the best local services effortlessly.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/signin" class="btn">Explore Services</a>
      </div>
    `, "Welcome")
    },
    {
        id: 7470222, // Welcome Business
        html: wrap(`
      <h1 class="h1">Welcome to Ouiimi Business!</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Congratulations on creating your business account. You can now reach more local customers.</p>
      <p class="p">Go to your dashboard to set up your profile and services.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">Go to Dashboard</a>
      </div>
    `, "Welcome Business")
    },
    {
        id: 7470249, // Business Approved (Assumption: Standard Welcome or specific message)
        html: wrap(`
      <h1 class="h1">Account Approved!</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Good news! Your business account has been approved.</p>
      <p class="p">Your services are now visible to shoppers on ouiimi.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">Manage Business</a>
      </div>
    `, "Approved")
    },
    {
        id: 7568667, // Booking Confirmation Shopper
        html: wrap(`
      <h1 class="h1">Booking Confirmed!</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Your appointment with <strong>{{var:businessName}}</strong> is confirmed.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}} at {{var:time}}</span></div>
        <div class="row"><span class="lbl">ID</span><span class="val">#{{var:bookingId}}</span></div>
      </div>
      <div class="card" style="background: #fff0f1;">
        <div class="row"><span class="lbl">Total</span><span class="val">$ {{var:totalCost}}</span></div>
        <div class="row"><span class="lbl">Deposit</span><span class="val">$ {{var:depositAmount}}</span></div>
      </div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/profile" class="btn">Manage Booking</a>
      </div>
    `, "Booking Confirmed")
    },
    {
        id: 7568585, // Booking Confirmation Business (Notification)
        html: wrap(`
      <h1 class="h1">New Booking!</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">You received a new booking for <strong>{{var:serviceName}}</strong>.</p>
      <div class="card">
        <div class="row"><span class="lbl">Customer</span><span class="val">{{var:customerName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}} at {{var:time}}</span></div>
      </div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">View Booking</a>
      </div>
    `, "New Booking")
    },
    {
        id: 7568563, // Appointment Reminder Shopper
        html: wrap(`
      <h1 class="h1">Appointment Reminder</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Reminder: You have an appointment tomorrow with <strong>{{var:businessName}}</strong>.</p>
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
      <p class="p">Your service with <strong>{{var:businessName}}</strong> is complete.</p>
      <div class="card">
        <div class="row"><span class="lbl">Total Paid</span><span class="val">$ {{var:totalCost}}</span></div>
      </div>
      <p class="p" style="text-align: center;">How was it? Leave a review!</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/profile" class="btn">Leave Review</a>
      </div>
    `, "Completed")
    },
    {
        id: 7568471, // Payment Receipt Small Business
        html: wrap(`
      <h1 class="h1">Payment Received</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">You received a payment of <strong>$ {{var:paymentAmount}}</strong>.</p>
      <div class="card">
        <div class="row"><span class="lbl">Service</span><span class="val">{{var:serviceName}}</span></div>
        <div class="row"><span class="lbl">Date</span><span class="val">{{var:date}}</span></div>
      </div>
      <div style="text-align: center; margin-top: 35px;">
        <a href="https://ouiimi.com/business/dashboard" class="btn">Dashboard</a>
      </div>
    `, "Receipt")
    },
    {
        id: 7469418, // Forgot Password
        html: wrap(`
      <h1 class="h1">Reset Password</h1>
      <p class="p">Hi {{var:fname}},</p>
      <p class="p">Requested a password reset? Click below.</p>
      <div style="text-align: center; margin-top: 35px;">
        <a href="{{var:uniquelink}}" class="btn">Reset Password</a>
      </div>
      <p class="p" style="font-size: 12px; margin-top: 20px;">Link expires in 1 hour.</p>
    `, "Reset Password")
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
            console.error(`Failed ${update.id}:`, e.message);
        }
    }
}

deploy();
