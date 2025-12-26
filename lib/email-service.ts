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
    static async sendPaymentReleased(booking: any, business: any, service: any, category?: string) {
        try {
            const amountReleased = booking.depositAmount - booking.platformFee;

            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                category: category || "Service", // Add category
                amountReleased: amountReleased.toFixed(2),
                paymentAmount: amountReleased.toFixed(2), // For template compatibility
                bookingNumber: booking.bookingNumber || booking._id.toString().slice(-8),
                releaseDate: new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })
            };

            // Use the specific Mailjet service function to ensure correct template is used
            // (Avoiding the generic fallback in this.sendEmail)
            const mailjetService = await import('@/lib/services/mailjet');
            await mailjetService.sendPaymentReceiptToBusiness(
                business.email,
                business.businessName,
                variables
            );

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
     * Send business approval notification
     */
    static async sendBusinessApproved(business: any, owner: any) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname}`,
                businessName: business.businessName,
                dashboardUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ouiimi.com.au'}/business/dashboard`,
                createServiceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://ouiimi.com.au'}/business/services/create`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `🎉 Your Ouiimi Business Account Has Been Approved!`,
                variables
            });

            console.log(`✅ Business approval email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business approval email:', error);
        }
    }

    /**
     * Send business rejection notification
     */
    static async sendBusinessRejected(business: any, owner: any, reason: string) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname}`,
                businessName: business.businessName,
                rejectionReason: reason || 'Not specified',
                supportEmail: process.env.MAILJET_FROM_EMAIL || 'support@ouiimi.com.au'
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Application Update - ${business.businessName}`,
                variables
            });

            console.log(`✅ Business rejection email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business rejection email:', error);
        }
    }

    /**
     * Send business suspension notification
     */
    static async sendBusinessSuspended(business: any, owner: any, reason: string) {
        try {
            const variables = {
                ownerName: `${owner.fname} ${owner.lname}`,
                businessName: business.businessName,
                suspensionReason: reason || 'Not specified',
                supportEmail: process.env.MAILJET_FROM_EMAIL || 'support@ouiimi.com.au'
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Account Suspended - ${business.businessName}`,
                variables
            });

            console.log(`✅ Business suspension email sent to: ${business.email}`);
        } catch (error) {
            console.error('❌ Failed to send business suspension email:', error);
        }
    }

    /**
     * Generic email sender - uses Mailjet or falls back to simple email
     */
    private static async sendEmail(params: EmailParams) {
        const { to, toName, subject, variables = {} } = params;

        try {
            // Import the Mailjet service dynamically
            const mailjetService = await import('@/lib/services/mailjet');

            // Log for debugging
            console.log(`📧 Sending email via Mailjet to: ${to}`);
            console.log(`Subject: ${subject}`);

            // Determine which template to use based on subject
            if (subject.includes('Approved')) {
                // Use business_approved template
                await mailjetService.sendBusinessApprovedEmail(
                    to,
                    variables.ownerName || toName,
                    variables.businessName || 'Your Business'
                );
            } else {
                // For rejection/suspension, send generic email using business_welcome template
                // (until specific templates are created in Mailjet)
                await mailjetService.sendEmail(
                    [to],
                    subject,
                    {
                        email: to,
                        fname: variables.ownerName || toName,
                        businessName: variables.businessName,
                        rejectionReason: variables.rejectionReason,
                        suspensionReason: variables.suspensionReason,
                        supportEmail: variables.supportEmail,
                        dashboardUrl: variables.dashboardUrl,
                        createServiceUrl: variables.createServiceUrl,
                    },
                    'business_welcome' as any
                );
            }

            console.log(`✅ Email sent successfully to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            // Don't throw - email failure shouldn't block the request
        }
    }
}

export default EmailService;
