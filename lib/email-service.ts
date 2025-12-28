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
import {
    formatBookingDate,
    formatAmount,
    getCustomerName,
    getBookingNumber,
    formatBusinessAddress,
    isValidEmail,
    validateEmailConfig
} from "@/lib/email-utils";

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
                customerName: getCustomerName(customer.fname, customer.lname),
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id),
                serviceName: service.serviceName,
                businessName: business.businessName,
                date: formatBookingDate(booking.timeSlot.date),
                startTime: booking.timeSlot?.startTime || 'TBD',
                endTime: booking.timeSlot?.endTime || 'TBD',
                totalCost: formatAmount(booking.totalCost),
                depositPaid: formatAmount(booking.depositAmount),
                remainingAmount: formatAmount(booking.remainingAmount),
                businessAddress: formatBusinessAddress(business.address),
                businessPhone: business.phone
            };

            await this.sendEmail({
                to: customer.email,
                toName: getCustomerName(customer.fname, customer.lname),
                subject: `Booking Confirmed - ${service.serviceName}`,
                variables,
                templateType: 'booking_confirmation_shopper'
            });

            console.log(`✅ [BOOKING_CONFIRMATION] Email sent to ${customer.email}`);
        } catch (error) {
            console.error(`❌ [BOOKING_CONFIRMATION] Failed to send to ${customer.email}:`, error);
            throw error;
        }
    }

    /**
     * Send new booking notification to business
     */
    static async sendNewBookingToBusiness({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: getCustomerName(customer.fname, customer.lname),
                customerEmail: customer.email,
                customerPhone: customer.contactNo || customer.phone || 'Not provided',
                serviceName: service.serviceName,
                date: formatBookingDate(booking.timeSlot?.date),
                startTime: booking.timeSlot?.startTime || 'TBD',
                endTime: booking.timeSlot?.endTime || 'TBD',
                totalCost: formatAmount(booking.totalCost),
                businessRevenue: formatAmount(Number(booking.depositAmount) - Number(booking.platformFee)),
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id),
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
            throw error;
        }
    }

    /**
     * Send service completion email to customer
     */
    static async sendServiceCompletedToCustomer({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                customerName: getCustomerName(customer.fname, customer.lname),
                serviceName: service.serviceName,
                businessName: business.businessName,
                date: formatBookingDate(booking.timeSlot?.date),
                remainingAmount: formatAmount(booking.remainingAmount),
                totalCost: formatAmount(booking.totalCost)
            };

            await this.sendEmail({
                to: customer.email,
                toName: getCustomerName(customer.fname, customer.lname),
                subject: `Service Completed - ${service.serviceName}`,
                variables,
                templateType: 'booking_complete'
            });

            console.log(`✅ [SERVICE_COMPLETE_CUSTOMER] Email sent to ${customer.email}`);
        } catch (error) {
            console.error(`❌ [SERVICE_COMPLETE_CUSTOMER] Failed to send to ${customer.email}:`, error);
            throw error;
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
                customerName: getCustomerName(customer.fname, customer.lname),
                date: formatBookingDate(booking.timeSlot?.date),
                startTime: booking.timeSlot?.startTime || 'TBD',
                endTime: booking.timeSlot?.endTime || 'TBD',
                expectedPayout: formatAmount(Number(booking.depositAmount) - Number(booking.platformFee)),
                totalCost: formatAmount(booking.totalCost),
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id),
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Service Completed - Payment Pending Release`,
                variables,
                templateType: 'booking_complete'
            });

            console.log(`✅ [SERVICE_COMPLETE_BUSINESS] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [SERVICE_COMPLETE_BUSINESS] Failed to send to ${business.email}:`, error);
            throw error;
        }
    }

    /**
     * Send payment released notification to business
     */
    static async sendPaymentReleased({ booking, business, service, customer, category }: PaymentReleasedPayload) {
        try {
            const amountReleased = Number(booking.depositAmount) - Number(booking.platformFee);
            const customerName = customer?.fname ? getCustomerName(customer.fname, customer.lname) : 'Customer';
            const variables = {
                businessName: business.businessName,
                serviceName: service.serviceName,
                customerName: customerName,
                category: category || "Service",
                amountReleased: formatAmount(amountReleased),
                paymentAmount: formatAmount(amountReleased), // For template compatibility
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id),
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

            console.log(`✅ [PAYMENT_RELEASED] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [PAYMENT_RELEASED] Failed to send to ${business.email}:`, error);
            throw error;
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
                customerName: getCustomerName(customer.fname, customer.lname),
                businessName: business.businessName,
                serviceName: service.serviceName,
                date: formatBookingDate(booking.timeSlot?.date),
                time: booking.timeSlot?.startTime || 'TBD',
                refundAmount: formatAmount(refundAmount),
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id)
            };

            await this.sendEmail({
                to: customer.email,
                toName: getCustomerName(customer.fname, customer.lname),
                subject: `Booking Cancelled - ${service.serviceName}`,
                variables,
                templateType: 'booking_cancellation_shopper'
            });

            console.log(`✅ [CANCELLATION_CUSTOMER] Email sent to ${customer.email}`);
        } catch (error) {
            console.error(`❌ [CANCELLATION_CUSTOMER] Failed to send to ${customer.email}:`, error);
            throw error;
        }
    }

    /**
     * Send cancellation notification to business
     */
    static async sendCancellationToBusiness({ booking, customer, business, service }: BookingEmailPayload) {
        try {
            const variables = {
                businessName: business.businessName,
                customerName: getCustomerName(customer.fname, customer.lname),
                serviceName: service.serviceName,
                date: formatBookingDate(booking.timeSlot?.date),
                startTime: booking.timeSlot?.startTime || 'TBD',
                bookingNumber: getBookingNumber(booking.bookingNumber, booking._id)
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Booking Cancelled - ${service.serviceName}`,
                variables,
                templateType: 'booking_cancellation_business'
            });

            console.log(`✅ [CANCELLATION_BUSINESS] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [CANCELLATION_BUSINESS] Failed to send to ${business.email}:`, error);
            throw error;
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
                emailBody: `<p class="p">Congratulations on taking the next step for your business! We are excited to partner with you.</p><p class="p">Your dashboard is ready. Log in now to complete your profile, list your services, and start accepting new clients.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Welcome to Ouiimi - Business Account Created`,
                variables,
                templateType: 'business_welcome'
            });

            console.log(`✅ [BUSINESS_WELCOME] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [BUSINESS_WELCOME] Failed to send to ${business.email}:`, error);
            throw error;
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

            console.log(`✅ [BUSINESS_APPROVED] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [BUSINESS_APPROVED] Failed to send to ${business.email}:`, error);
            throw error;
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
                emailBody: `<p class="p">We regret to inform you that your application for <strong>${business.businessName}</strong> has been declined.</p><p class="p"><strong>Reason:</strong> ${reason || 'Does not meet our criteria'}</p><p class="p">If you have any questions, please contact support.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Application Update - ${business.businessName}`,
                variables,
                templateType: 'business_rejected'
            });

            console.log(`✅ [BUSINESS_REJECTED] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [BUSINESS_REJECTED] Failed to send to ${business.email}:`, error);
            throw error;
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
                emailBody: `<p class="p">Your account for <strong>${business.businessName}</strong> has been suspended.</p><p class="p"><strong>Reason:</strong> ${reason || 'Violation of terms'}</p><p class="p">Please contact support to resolve this issue.</p>`
            };

            await this.sendEmail({
                to: business.email,
                toName: business.businessName,
                subject: `Business Account Suspended - ${business.businessName}`,
                variables,
                templateType: 'business_suspended'
            });

            console.log(`✅ [BUSINESS_SUSPENDED] Email sent to ${business.email}`);
        } catch (error) {
            console.error(`❌ [BUSINESS_SUSPENDED] Failed to send to ${business.email}:`, error);
            throw error;
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
            console.log(`✅ [ACCOUNT_VERIFICATION] Email sent to ${recipient.email}`);
        } catch (error) {
            console.error(`❌ [ACCOUNT_VERIFICATION] Failed to send to ${recipient.email}:`, error);
            throw error;
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
            console.log(`✅ [PASSWORD_RESET] Email sent to ${recipient.email}`);
        } catch (error) {
            console.error(`❌ [PASSWORD_RESET] Failed to send to ${recipient.email}:`, error);
            throw error;
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
            console.log(`✅ [SHOPPER_WELCOME] Email sent to ${recipient.email}`);
        } catch (error) {
            console.error(`❌ [SHOPPER_WELCOME] Failed to send to ${recipient.email}:`, error);
            throw error;
        }
    }

    /**
     * Generic email sender - uses new centralized HTML templates
     */
    private static async sendEmail(params: EmailParams & { templateType?: string }) {
        const { to, toName, subject, variables = {}, templateType } = params;

        try {
            // Import template generators
            const templates = await import('@/lib/email-templates');
            const mailjetService = await import('@/lib/services/mailjet');

            console.log(`📧 Sending email to: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`Template: ${templateType || 'CUSTOM'}`);

            let htmlContent: string;

            // Generate HTML based on template type
            switch (templateType) {
                case 'welcome':
                    htmlContent = templates.generateWelcomeEmail({
                        fname: variables.fname || variables.customerName || toName
                    });
                    break;

                case 'booking_confirmation_shopper':
                    htmlContent = templates.generateBookingConfirmationEmail({
                        customerName: variables.customerName,
                        serviceName: variables.serviceName,
                        businessName: variables.businessName,
                        date: variables.date,
                        startTime: variables.startTime,
                        endTime: variables.endTime,
                        depositPaid: variables.depositPaid,
                        remainingAmount: variables.remainingAmount,
                        businessAddress: variables.businessAddress,
                        bookingNumber: variables.bookingNumber
                    });
                    break;

                case 'booking_complete':
                    htmlContent = templates.generateBookingCompleteEmail({
                        businessName: variables.businessName,
                        shopperName: variables.customerName,
                        serviceName: variables.serviceName,
                        date: variables.date,
                        time: `${variables.startTime} - ${variables.endTime}`,
                        depositAmount: variables.depositPaid || variables.depositAmount,
                        payoutAmount: variables.businessRevenue || variables.expectedPayout,
                        bookingId: variables.bookingNumber
                    });
                    break;

                case 'booking_cancellation_business':
                    htmlContent = templates.generateCancellationBusinessEmail({
                        businessName: variables.businessName,
                        shopperName: variables.customerName,
                        serviceName: variables.serviceName,
                        date: variables.date
                    });
                    break;

                case 'cancellation_payout':
                case 'payment_receipt':
                    htmlContent = templates.generateCancellationPaymentEmail({
                        shopperName: variables.customerName,
                        serviceName: variables.serviceName,
                        date: variables.date,
                        time: variables.startTime,
                        depositAmount: variables.paymentAmount || variables.amountReleased,
                        payoutStatus: 'Completed'
                    });
                    break;

                case 'business_approved':
                    htmlContent = templates.generateBusinessApprovedEmail({
                        ownerName: variables.ownerName,
                        businessName: variables.businessName,
                        dashboardUrl: variables.dashboardUrl
                    });
                    break;

                case 'forgot_password':
                    htmlContent = templates.generatePasswordResetEmail({
                        fname: variables.fname,
                        uniquelink: variables.uniquelink
                    });
                    break;

                case 'account_verification':
                    htmlContent = templates.generateAccountVerificationEmail({
                        fname: variables.fname,
                        uniquelink: variables.uniquelink
                    });
                    break;

                // NEW BOOKING TO BUSINESS
                case 'booking_confirmation_business':
                    htmlContent = templates.generateNewBookingToBusinessEmail({
                        businessName: variables.businessName,
                        customerName: variables.customerName,
                        customerEmail: variables.customerEmail,
                        customerPhone: variables.customerPhone,
                        serviceName: variables.serviceName,
                        date: variables.date,
                        startTime: variables.startTime,
                        endTime: variables.endTime,
                        totalCost: variables.totalCost,
                        businessRevenue: variables.businessRevenue,
                        bookingNumber: variables.bookingNumber
                    });
                    break;

                // CANCELLATION TO CUSTOMER
                case 'booking_cancellation_shopper':
                    htmlContent = templates.generateCancellationToCustomerEmail({
                        customerName: variables.customerName,
                        businessName: variables.businessName,
                        serviceName: variables.serviceName,
                        date: variables.date,
                        time: variables.time,
                        refundAmount: variables.refundAmount,
                        bookingNumber: variables.bookingNumber
                    });
                    break;

                // BUSINESS WELCOME
                case 'business_welcome':
                    htmlContent = templates.generateBusinessWelcomeEmail({
                        ownerName: variables.ownerName || variables.businessName,
                        businessName: variables.businessName
                    });
                    break;

                // BUSINESS REJECTED
                case 'business_rejected':
                    htmlContent = templates.generateBusinessRejectedEmail({
                        ownerName: variables.ownerName,
                        businessName: variables.businessName,
                        rejectionReason: variables.rejectionReason,
                        supportEmail: variables.supportEmail
                    });
                    break;

                // BUSINESS SUSPENDED
                case 'business_suspended':
                    htmlContent = templates.generateBusinessSuspendedEmail({
                        ownerName: variables.ownerName,
                        businessName: variables.businessName,
                        suspensionReason: variables.suspensionReason,
                        supportEmail: variables.supportEmail
                    });
                    break;

                default:
                    console.warn(`⚠️  Template type '${templateType}' not yet migrated to HTML templates. Using fallback.`);
                    // Fallback: create a simple HTML email
                    htmlContent = templates.generateWelcomeEmail({
                        fname: variables.fname || toName || 'User'
                    });
            }

            // Send HTML email via Mailjet
            await mailjetService.sendHTMLEmail([to], subject, htmlContent, toName);

            console.log(`✅ Email sent successfully to ${to}`);
        } catch (error) {
            console.error(`❌ Failed to send email to ${to}:`, error);
            throw error;
        }
    }
}

export default EmailService;
