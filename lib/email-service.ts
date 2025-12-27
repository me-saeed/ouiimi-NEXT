/**
 * Centralized Email Service
 * Handles all email sending via Mailjet with Strict Type Safety
 */

import {
    BookingEmailPayload,
    PaymentReleasedPayload,
    BusinessStatusPayload,
    EmailBusiness,
    EmailRecipient
} from "@/lib/types/email-notifications";

interface EmailParams {
    to: string;
    toName: string;
    subject: string;
    templateId?: number;
    variables?: Record<string, any>;
    htmlContent?: string;
}

export class EmailService {
    private static mailjetApiKey = process.env.MAILJET_API_KEY;
    private static mailjetSecretKey = process.env.MAILJET_SECRET_KEY;


    /**
     * Send booking confirmation email to customer
     */
    static async sendBookingConfirmation({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8),
                serviceName: service.serviceName,
                businessName: business.businessName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                startTime: booking.timeSlot.startTime,
                endTime: booking.timeSlot.endTime,
                totalCost: Number(booking.totalCost).toFixed(2),
                depositPaid: Number(booking.depositAmount).toFixed(2),
                remainingAmount: Number(booking.remainingAmount).toFixed(2),
                businessAddress: typeof business.address === 'object'
                    ? `${business.address.street}, ${business.address.city}`
                    : business.address,
                businessPhone: business.phone
            };

            await this.sendEmail({
                to: customer.email,
                toName: `${customer.fname} ${customer.lname || ''}`.trim(),
                subject: `Booking Confirmed - ${service.serviceName}`,
                variables,
                templateType: 'booking_confirmation_shopper'
            });

            console.log(`✅ Booking confirmation email sent to ${customer.email}`);
        } catch (error) {
            console.error('❌ Failed to send booking confirmation email:', error);
        }
    }

    /**
     * Send new booking notification to business
     */
    static async sendNewBookingToBusiness({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                customerEmail: customer.email,
                customerPhone: customer.contactNo || customer.phone || 'Not provided',
                serviceName: service.serviceName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                startTime: booking.timeSlot.startTime,
                endTime: booking.timeSlot.endTime,
                totalCost: Number(booking.totalCost).toFixed(2),
                businessRevenue: (Number(booking.depositAmount) - Number(booking.platformFee)).toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8),
                emailTitle: "New Booking Received",
                introText: `You have received a new booking request for <strong>${service.serviceName}</strong>.`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `New Booking Received - ${service.serviceName}`,
                variables,
                templateType: 'booking_confirmation_business'
            });

            console.log(`✅ New booking notification sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business notification:', error);
        }
    }

    /**
     * Send service completion email to customer
     */
    static async sendServiceCompletedToCustomer({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                serviceName: service.serviceName,
                businessName: business.businessName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                remainingAmount: Number(booking.remainingAmount).toFixed(2),
                totalCost: Number(booking.totalCost).toFixed(2)
            };

            await this.sendEmail({
                to: customer.email,
                toName: `${customer.fname} ${customer.lname || ''}`.trim(),
                subject: `Service Completed - ${service.serviceName}`,
                variables,
                templateType: 'booking_complete'
            });

            console.log(`✅ Service completion email sent to customer: ${customer.email}`);
        } catch (error) {
            console.error('❌ Failed to send completion email to customer:', error);
        }
    }

    /**
     * Send service completion notification to business
     */
    static async sendServiceCompletedToBusiness({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                startTime: booking.timeSlot.startTime,
                endTime: booking.timeSlot.endTime,
                expectedPayout: (Number(booking.depositAmount) - Number(booking.platformFee)).toFixed(2),
                totalCost: Number(booking.totalCost).toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8),
                emailTitle: "Service Completed",
                introText: `The service <strong>${service.serviceName}</strong> has been marked as completed.`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Service Completed - Payment Pending Release`,
                variables,
                templateType: 'booking_confirmation_business'
            });

            console.log(`✅ Service completion email sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send completion email to business:', error);
        }
    }

    /**
     * Send payment released notification to business
     */
    static async sendPaymentReleased({ booking, business, service, customer, category }: PaymentReleasedPayload) {
        try {
            const amountReleased = Number(booking.depositAmount) - Number(booking.platformFee);
            const customerName = customer?.fname ? `${customer.fname} ${customer.lname || ''}`.trim() : 'Customer';
            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                customerName: customerName,
                category: category || "Service",
                amountReleased: amountReleased.toFixed(2),
                paymentAmount: amountReleased.toFixed(2), // For template compatibility
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8),
                releaseDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Payment Receipt - ${service.serviceName} Booking Completed`,
                variables,
                templateType: 'payment_receipt'
            });

            console.log(`✅ Payment released email sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send payment released email:', error);
        }
    }

    /**
     * Send cancellation notification to customer
     */
    static async sendCancellationToCustomer({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const refundAmount = booking.paymentStatus === 'deposit_paid' || booking.paymentStatus === 'fully_paid'
                ? Number(booking.depositAmount)
                : 0;

            const variables = {
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                businessName: business.businessName,
                serviceName: service.serviceName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                time: booking.timeSlot.startTime,
                refundAmount: refundAmount.toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8)
            };

            await this.sendEmail({
                to: customer.email,
                toName: `${customer.fname} ${customer.lname || ''}`.trim(),
                subject: `Booking Cancelled - ${service.serviceName}`,
                variables,
                templateType: 'booking_cancellation_shopper'
            });

            console.log(`✅ Cancellation notification sent to customer: ${customer.email}`);
        } catch (error) {
            console.error('❌ Failed to send cancellation email to customer:', error);
        }
    }

    /**
     * Send cancellation notification to business
     */
    static async sendCancellationToBusiness({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: `${customer.fname} ${customer.lname || ''}`.trim(),
                serviceName: service.serviceName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                startTime: booking.timeSlot.startTime,
                bookingNumber: booking.bookingNumber || booking._id?.toString().slice(-8)
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Booking Cancelled - ${service.serviceName}`,
                variables,
                templateType: 'booking_cancellation_business'
            });

            console.log(`✅ Cancellation notification sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send cancellation email:', error);
        }
    }

    /**
     * Send business welcome notification
     */
    static async sendBusinessWelcome(business: EmailBusiness, owner: EmailRecipient) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname || ''}`.trim(),
                businessName: business.businessName,
                emailTitle: "Welcome to Ouiimi Business",
                emailBody: `<p class="p">Congratulations on taking the next step for your business! We are excited to partner with you.</p><p class="p">Your dashboard is ready. Log in now to complete your profile, list your services, and start accepting new clients.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Welcome to Ouiimi - Business Account Created`,
                variables,
                templateType: 'business_welcome'
            });

            console.log(`✅ Business welcome email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business welcome email:', error);
        }
    }

    /**
     * Send business approval notification
     */
    static async sendBusinessApproved({ business, owner }: BusinessStatusPayload) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname || ''}`.trim(),
                businessName: business.businessName,
                dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ouiimi.com.au'}/business/dashboard`,
                createServiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ouiimi.com.au'}/business/services/create`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `🎉 Your Ouiimi Business Account Has Been Approved!`,
                variables,
                templateType: 'business_approved'
            });

            console.log(`✅ Business approval email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business approval email:', error);
        }
    }

    /**
     * Send business rejection notification
     */
    static async sendBusinessRejected({ business, owner, reason }: BusinessStatusPayload) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname || ''}`.trim(),
                businessName: business.businessName,
                rejectionReason: reason || 'Not specified',
                supportEmail: process.env.MAILJET_FROM_EMAIL || 'support@ouiimi.com.au',
                emailTitle: "Business Application Update",
                emailBody: `<p class="p">We regret to inform you that your application for <strong>${business.businessName}</strong> has been declined.</p><p class="p"><strong>Reason:</strong> ${reason || 'Does not meet our criteria'}</p><p class="p">If you have any questions, please contact support.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Application Update - ${business.businessName}`,
                variables,
                templateType: 'business_welcome'
            });

            console.log(`✅ Business rejection email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business rejection email:', error);
        }
    }

    /**
     * Send business suspension notification
     */
    static async sendBusinessSuspended({ business, owner, reason }: BusinessStatusPayload) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname || ''}`.trim(),
                businessName: business.businessName,
                suspensionReason: reason || 'Not specified',
                supportEmail: process.env.MAILJET_FROM_EMAIL || 'support@ouiimi.com.au',
                emailTitle: "Account Suspended",
                emailBody: `<p class="p">Your account for <strong>${business.businessName}</strong> has been suspended.</p><p class="p"><strong>Reason:</strong> ${reason || 'Violation of terms'}</p><p class="p">Please contact support to resolve this issue.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Account Suspended - ${business.businessName}`,
                variables,
                templateType: 'business_welcome'
            });

            console.log(`✅ Business suspension email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business suspension email:', error);
        }
    }

    /**
     * Send account verification email
     */
    static async sendAccountVerification(recipient: EmailRecipient, link: string) {
        try {
            await this.sendEmail({
                to: recipient.email,
                toName: recipient.fname,
                subject: "Verify Your Email - Ouiimi",
                variables: {
                    fname: recipient.fname,
                    uniquelink: link
                },
                templateType: 'account_verification'
            });
            console.log(`✅ Verification email sent to ${recipient.email}`);
        } catch (error) {
            console.error('❌ Failed to send verification email:', error);
        }
    }

    /**
     * Send password reset email
     */
    static async sendPasswordReset(recipient: EmailRecipient, link: string) {
        try {
            await this.sendEmail({
                to: recipient.email,
                toName: recipient.fname,
                subject: "Password Reset Request - Ouiimi",
                variables: {
                    fname: recipient.fname,
                    uniquelink: link
                },
                templateType: 'forgot_password'
            });
            console.log(`✅ Password reset email sent to ${recipient.email}`);
        } catch (error) {
            console.error('❌ Failed to send password reset email:', error);
        }
    }

    /**
     * Send shopper welcome email
     */
    static async sendShopperWelcome(recipient: EmailRecipient) {
        try {
            await this.sendEmail({
                to: recipient.email,
                toName: recipient.fname,
                subject: "Welcome to Ouiimi",
                variables: {
                    fname: recipient.fname
                },
                templateType: 'welcome'
            });
            console.log(`✅ Shopper welcome email sent to ${recipient.email}`);
        } catch (error) {
            console.error('❌ Failed to send shopper welcome email:', error);
        }
    }

    /**
     * Generic email sender - uses Mailjet
     */
    private static async sendEmail(params: EmailParams & { templateType?: string }) {
        const { to, toName, subject, variables = {}, templateType } = params;

        try {
            // Import the Mailjet service dynamically
            const mailjetService = await import('@/lib/services/mailjet');

            // Log for debugging
            console.log(`📧 Sending email via Mailjet to: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Template: ${templateType || 'GUESSED'}`);

            // Prepare base data for Mailjet
            const emailData = {
                email: to,
                fname: variables.ownerName || toName || variables.customerName || variables.fname,
                ...variables
            };

            // Use explicit template if provided (PREFERRED)
            if (templateType && templateType in mailjetService.TEMPLATE_IDS) {
                await mailjetService.sendEmail(
                    [to],
                    subject,
                    emailData,
                    templateType as any
                );
            } else {
                console.warn(`⚠️  Template type '${templateType}' not found in known IDs.`);
            }

            console.log(`✅ Email sent successfully to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
        }
    }
}

export default EmailService;
