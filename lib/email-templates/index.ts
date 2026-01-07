/**
 * Email Content Generators
 * Each function generates the content section (without header/footer) for a specific email type
 */

import { wrapEmailContent, formatDetailRow, formatClosing } from './base';
import { escapeHTML } from '@/lib/email-utils';

/**
 * Welcome Email for new shoppers
 */
export function generateWelcomeEmail(variables: { fname: string }): string {
  const content = `
    <h1 class="heading">Welcome To ouiimi</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.fname)},</p>
    
    <p class="body-text">
      Welcome to ouiimi — an easier way to discover, book, and manage everyday services.
    </p>
    
    <p class="body-text">
      From salons and nails to massage and dog grooming — we're building a place that helps you spend less time searching and more time enjoying.
    </p>
    
    <p class="body-text">
      You can log in anytime to manage bookings, track appointments, or explore new services in your area.
    </p>
    
    <p class="body-text">
      Book your first service: ouiimi.com
    </p>
    
    ${formatClosing('Warmly,<br>ouiimi Team')}
  `;

  return wrapEmailContent(content);
}

/**
 * Booking Confirmation Email for shoppers
 */
export function generateBookingConfirmationEmail(variables: {
  customerName: string;
  serviceName: string;
  businessName: string;
  date: string;
  startTime: string;
  endTime: string;
  depositPaid: string;
  remainingAmount: string;
  businessAddress: string;
  bookingNumber: string;
}): string {
  const content = `
    <h1 class="heading">Booking Confirmed.</h1>
    
    <p class="body-text">
      Your booking with ${escapeHTML(variables.businessName)} has been confirmed.
    </p>
    
    <p class="section-label">Booking Details.</p>
    
    ${formatDetailRow('Booking ID', variables.bookingNumber)}
    ${formatDetailRow('Shopper', variables.customerName)}
    ${formatDetailRow('Service', variables.serviceName)}
    ${formatDetailRow('Appointment Date', variables.date)}
    ${formatDetailRow('Appointment Time', `${variables.startTime} - ${variables.endTime}`)}
    ${formatDetailRow('Location', variables.businessAddress)}
    ${formatDetailRow('Deposit Paid', `AUD $${variables.depositPaid}`)}
    ${formatDetailRow('Remaining (pay at venue)', `AUD $${variables.remainingAmount}`)}
    
    <p class="body-text" style="margin-top: 24px;">
      We hope you enjoy your service! If you have any questions, feel free to reach out.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Booking Complete Email (to business)
 */
export function generateBookingCompleteEmail(variables: {
  businessName: string;
  shopperName: string;
  serviceName: string;
  date: string;
  time: string;
  depositAmount: string;
  payoutAmount: string;
  bookingId: string;
}): string {
  const content = `
    <h1 class="heading">Booking Complete.</h1>
    
    <p class="body-text">
      Your booking with [${escapeHTML(variables.shopperName)}] has been marked as completed, and your payout has now been processed.
    </p>
    
    <p class="section-label">Booking Details.</p>
    
    ${formatDetailRow('Booking-ID', variables.bookingId)}
    ${formatDetailRow('Shopper', variables.shopperName)}
    ${formatDetailRow('Service', variables.serviceName)}
    ${formatDetailRow('Appointment Date', variables.date)}
    ${formatDetailRow('Appointment Time', variables.time)}
    ${formatDetailRow('Total Deposit', `AUD $${variables.depositAmount}`)}
    ${formatDetailRow('Deposit (100% of Deposit)', '')}
    ${formatDetailRow('50% to Business', `AUD $${variables.payoutAmount}`)}
    ${formatDetailRow('Payout Status', 'Completed')}
    ${formatDetailRow('Payment Method', 'Sent to your nominated bank account')}
    
    <p class="body-text" style="margin-top: 24px;">
      Thank you for providing great service through ouiimi.
    </p>
    
    <p class="body-text">
      We're here to help you grow and manage your bookings with ease.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Cancellation Email (to business)
 */
export function generateCancellationBusinessEmail(variables: {
  businessName: string;
  shopperName: string;
  serviceName: string;
  date: string;
}): string {
  const content = `
    <h1 class="heading">Booking Details.</h1>
    
    <p class="body-text">Hi [${escapeHTML(variables.businessName)}],</p>
    
    <p class="body-text">
      We regret to inform you that your recent booking by [${escapeHTML(variables.shopperName)}] for [${escapeHTML(variables.serviceName)}] on [${variables.date}] has been cancelled.
    </p>
    
    <p class="body-text">
      We understand this can be disappointing, and we're sorry for the inconvenience. As per ouiimi policy, you will still receive 50% of their deposit for this booking. this amount will be paid out shortly.
    </p>
    
    <p class="body-text">
      Thank you for being part of ouiimi, we're here to support your business anytime.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Cancellation Payment Email (to business)
 */
export function generateCancellationPaymentEmail(variables: {
  shopperName: string;
  serviceName: string;
  date: string;
  time: string;
  depositAmount: string;
  payoutStatus: string;
}): string {
  const content = `
    <h1 class="heading">Cancellation Payment.</h1>
    
    <p class="body-text">
      We've processed your 50% deposit payout for the cancelled booking.
    </p>
    
    <p class="section-label">Here are the details:</p>
    
    ${formatDetailRow('Shopper', variables.shopperName)}
    ${formatDetailRow('Service', variables.serviceName)}
    ${formatDetailRow('Original Appointment Date', variables.date + ' / ' + variables.time)}
    ${formatDetailRow('50% Deposit', `AUD $${variables.depositAmount}`)}
    ${formatDetailRow('Payout Status', variables.payoutStatus)}
    ${formatDetailRow('Payment Method', 'Sent to your nominated bank account')}
    
    <p class="body-text" style="margin-top: 24px;">
      As per ouiimi's cancellation policy, businesses receive 50% of the shopper's deposit when a customer cancels their booking.
    </p>
    
    <p class="body-text">
      If you have any questions or need support, feel free to reach out — we're here to help.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Business Approved Email
 */
export function generateBusinessApprovedEmail(variables: {
  ownerName: string;
  businessName: string;
  dashboardUrl: string;
}): string {
  const content = `
    <h1 class="heading">Your Business Has Been Approved!</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.ownerName)},</p>
    
    <p class="body-text">
      Great news! Your business <strong>${escapeHTML(variables.businessName)}</strong> has been approved and is now live on ouiimi.
    </p>
    
    <p class="body-text">
      You can now start accepting bookings, managing your services, and growing your business.
    </p>
    
    <p class="body-text">
      <a href="${variables.dashboardUrl}" style="color: #EECFD1; text-decoration: underline;">Visit your dashboard</a>
    </p>
    
    ${formatClosing('Welcome to ouiimi,<br>The ouiimi Team')}
  `;

  return wrapEmailContent(content);
}

/**
 * Password Reset Email
 */
export function generatePasswordResetEmail(variables: {
  fname: string;
  uniquelink: string;
}): string {
  const content = `
    <h1 class="heading">Password Reset Request</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.fname)},</p>
    
    <p class="body-text">
      We received a request to reset your password. Click the link below to create a new password:
    </p>
    
    <p class="body-text">
      <a href="${variables.uniquelink}" style="color: #EECFD1; text-decoration: underline;">Reset Password</a>
    </p>
    
    <p class="body-text">
      If you didn't request this, please ignore this email.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Account Verification Email
 */
export function generateAccountVerificationEmail(variables: {
  fname: string;
  uniquelink: string;
}): string {
  const content = `
    <h1 class="heading">Verify Your Email</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.fname)},</p>
    
    <p class="body-text">
      Welcome to ouiimi! Please verify your email address to get started:
    </p>
    
    <p class="body-text">
      <a href="${variables.uniquelink}" style="color: #EECFD1; text-decoration: underline;">Verify Email</a>
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * New Booking Notification (to business)
 */
export function generateNewBookingToBusinessEmail(variables: {
  businessName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  date: string;
  startTime: string;
  endTime: string;
  totalCost: string;
  businessRevenue: string;
  bookingNumber: string;
}): string {
  const content = `
    <h1 class="heading">New Booking Received.</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.businessName)},</p>
    
    <p class="body-text">
      You have received a new booking request for <strong>${escapeHTML(variables.serviceName)}</strong>.
    </p>
    
    <p class="section-label">Booking Details.</p>
    
    ${formatDetailRow('Booking ID', variables.bookingNumber)}
    ${formatDetailRow('Customer', variables.customerName)}
    ${formatDetailRow('Customer Email', variables.customerEmail)}
    ${formatDetailRow('Customer Phone', variables.customerPhone)}
    ${formatDetailRow('Service', variables.serviceName)}
    ${formatDetailRow('Date', variables.date)}
    ${formatDetailRow('Time', `${variables.startTime} - ${variables.endTime}`)}
    ${formatDetailRow('Total Cost', `AUD $${variables.totalCost}`)}
    ${formatDetailRow('Your Revenue', `AUD $${variables.businessRevenue}`)}
    
    <p class="body-text" style="margin-top: 24px;">
      Please ensure you're prepared for this appointment. If you have any questions, feel free to reach out.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Service Completed (to customer)
 */
export function generateServiceCompletedToCustomerEmail(variables: {
  customerName: string;
  serviceName: string;
  businessName: string;
  date: string;
  remainingAmount: string;
  totalCost: string;
}): string {
  const content = `
    <h1 class="heading">Service Completed.</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.customerName)},</p>
    
    <p class="body-text">
      Your service <strong>${escapeHTML(variables.serviceName)}</strong> with ${escapeHTML(variables.businessName)} has been marked as completed.
    </p>
    
    <p class="body-text">
      We hope you enjoyed your experience! The remaining balance of <strong>AUD $${variables.remainingAmount}</strong> should be paid directly to the business if it hasn't been already.
    </p>
    
    <p class="body-text">
      Thank you for using ouiimi. We'd love to see you again soon!
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Cancellation (to customer)
 */
export function generateCancellationToCustomerEmail(variables: {
  customerName: string;
  businessName: string;
  serviceName: string;
  date: string;
  time: string;
  refundAmount: string;
  bookingNumber: string;
}): string {
  const content = `
    <h1 class="heading">Booking Cancelled.</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.customerName)},</p>
    
    <p class="body-text">
      Your booking for <strong>${escapeHTML(variables.serviceName)}</strong> with ${escapeHTML(variables.businessName)} on ${variables.date} at ${variables.time} has been cancelled.
    </p>
    
    <p class="section-label">Refund Information:</p>
    
    ${formatDetailRow('Booking Number', variables.bookingNumber)}
    ${formatDetailRow('Service', variables.serviceName)}
    ${formatDetailRow('Business', variables.businessName)}
    ${formatDetailRow('Date', variables.date)}
    ${formatDetailRow('Time', variables.time)}
    ${formatDetailRow('Refund Amount', `AUD $${variables.refundAmount}`)}
    
    <p class="body-text" style="margin-top: 24px;">
      Your refund will be processed within 3-5 business days. If you have any questions, feel free to reach out.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Business Welcome Email
 */
export function generateBusinessWelcomeEmail(variables: {
  ownerName: string;
  businessName: string;
}): string {
  const content = `
    <h1 class="heading">Welcome to ouiimi Business</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.ownerName)},</p>
    
    <p class="body-text">
      Congratulations on taking the next step for your business! We are excited to partner with you.
    </p>
    
    <p class="body-text">
      Your dashboard is ready. Log in now to complete your profile, list your services, and start accepting new clients.
    </p>
    
    <p class="body-text">
      We're here to help you grow and manage your bookings with ease.
    </p>
    
    ${formatClosing('Welcome to ouiimi,<br>The ouiimi Team')}
  `;

  return wrapEmailContent(content);
}

/**
 * Business Rejected Email
 */
export function generateBusinessRejectedEmail(variables: {
  ownerName: string;
  businessName: string;
  rejectionReason: string;
  supportEmail: string;
}): string {
  const content = `
    <h1 class="heading">Business Application Update</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.ownerName)},</p>
    
    <p class="body-text">
      We regret to inform you that your application for <strong>${escapeHTML(variables.businessName)}</strong> has been declined.
    </p>
    
    <p class="body-text">
      <strong>Reason:</strong> ${escapeHTML(variables.rejectionReason)}
    </p>
    
    <p class="body-text">
      If you have any questions, please contact us at ${variables.supportEmail}.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}

/**
 * Business Suspended Email
 */
export function generateBusinessSuspendedEmail(variables: {
  ownerName: string;
  businessName: string;
  suspensionReason: string;
  supportEmail: string;
}): string {
  const content = `
    <h1 class="heading">Account Suspended</h1>
    
    <p class="body-text">Hi ${escapeHTML(variables.ownerName)},</p>
    
    <p class="body-text">
      Your account for <strong>${escapeHTML(variables.businessName)}</strong> has been suspended.
    </p>
    
    <p class="body-text">
      <strong>Reason:</strong> ${escapeHTML(variables.suspensionReason)}
    </p>
    
    <p class="body-text">
      Please contact support at ${variables.supportEmail} to resolve this issue.
    </p>
    
    ${formatClosing()}
  `;

  return wrapEmailContent(content);
}
