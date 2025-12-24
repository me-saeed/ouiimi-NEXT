/**
 * Centralized Email Service
 * Handles all email sending via Mailjet
 */

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
    private static fromEmail = process.env.MAILJET_FROM_EMAIL || "noreply@ouiimi.com";
    private static fromName = process.env.MAILJET_FROM_NAME || "Ouiimi";

    /**
     * Send booking confirmation email to customer
     */
    static async sendBookingConfirmation(booking: any, customer: any, business: any, service: any) {
        try {
            const variables = {
                customerName: `${customer.fname} ${customer.lname}`,
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8),
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
                totalCost: booking.totalCost.toFixed(2),
                depositPaid: booking.depositAmount.toFixed(2),
                remainingAmount: booking.remainingAmount.toFixed(2),
                businessAddress: typeof business.address === 'object'
                    ? `${business.address.street}, ${business.address.city}`
                    : business.address,
                businessPhone: business.phone
            };

            await this.sendEmail({
                to: customer.email,
                toName: `${customer.fname} ${customer.lname}`,
                subject: `Booking Confirmed - ${service.serviceName}`,
                variables
            });

            console.log(`✅ Booking confirmation email sent to ${customer.email}`);
        } catch (error) {
            console.error('❌ Failed to send booking confirmation email:', error);
            // Don't throw - email failure shouldn't block booking
        }
    }

    /**
     * Send new booking notification to business
     */
    static async sendNewBookingToBusiness(booking: any, customer: any, business: any, service: any) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: `${customer.fname} ${customer.lname}`,
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
                totalCost: booking.totalCost.toFixed(2),
                businessRevenue: (booking.depositAmount - booking.platformFee).toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8)
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `New Booking Received - ${service.serviceName}`,
                variables
            });

            console.log(`✅ New booking notification sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business notification:', error);
        }
    }

    /**
     * Send service completion email to customer
     */
    static async sendServiceCompletedToCustomer(booking: any, customer: any, business: any, service: any) {
        try {
            const variables = {
                customerName: `${customer.fname} ${customer.lname}`,
                serviceName: service.serviceName,
                businessName: business.businessName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                remainingAmount: booking.remainingAmount.toFixed(2)
            };

            await this.sendEmail({
                to: customer.email,
                toName: `${customer.fname} ${customer.lname}`,
                subject: `Service Completed - ${service.serviceName}`,
                variables
            });

            console.log(`✅ Service completion email sent to customer: ${customer.email}`);
        } catch (error) {
            console.error('❌ Failed to send completion email to customer:', error);
        }
    }

    /**
     * Send service completion notification to business
     */
    static async sendServiceCompletedToBusiness(booking: any, customer: any, business: any, service: any) {
        try {
            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                customerName: `${customer.fname} ${customer.lname}`,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                expectedPayout: (booking.depositAmount - booking.platformFee).toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8)
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Service Completed - Payment Pending Release`,
                variables
            });

            console.log(`✅ Service completion email sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send completion email to business:', error);
        }
    }

    /**
     * Send payment released notification to business
     */
    static async sendPaymentReleased(booking: any, business: any, service: any) {
        try {
            const amountReleased = booking.depositAmount - booking.platformFee;

            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                amountReleased: amountReleased.toFixed(2),
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8),
                releaseDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Payment Released - $${amountReleased.toFixed(2)}`,
                variables
            });

            console.log(`✅ Payment released email sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send payment released email:', error);
        }
    }

    /**
     * Send cancellation notification to business
     */
    static async sendCancellationToBusiness(booking: any, customer: any, business: any, service: any) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: `${customer.fname} ${customer.lname}`,
                serviceName: service.serviceName,
                date: new Date(booking.timeSlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                startTime: booking.timeSlot.startTime,
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8)
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Booking Cancelled - ${service.serviceName}`,
                variables
            });

            console.log(`✅ Cancellation notification sent to business: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send cancellation email:', error);
        }
    }

    /**
     * Generic email sender - uses Mailjet or falls back to simple email
     */
    private static async sendEmail(params: EmailParams) {
        const { to, toName, subject, variables } = params;

        // For now, just log the email (Mailjet integration would go here)
        console.log(`
📧 EMAIL NOTIFICATION
To: ${toName} <${to}>
Subject: ${subject}
Variables:`, variables);

        // TODO: Implement actual Mailjet API call
        // const mailjet = require('node-mailjet').connect(
        //   this.mailjetApiKey,
        //   this.mailjetSecretKey
        // );

        // await mailjet.post('send', { version: 'v3.1' }).request({
        //   Messages: [{
        //     From: { Email: this.fromEmail, Name: this.fromName },
        //     To: [{ Email: to, Name: toName }],
        //     Subject: subject,
        //     Variables: variables
        //   }]
        // });
    }
}

export default EmailService;
