/**
 * Email Toast Utility
 * Provides consistent toast notifications for email actions across the app
 */

import { toast } from "@/hooks/use-toast";

export const showEmailToast = (
    type: "verification" | "reset" | "confirmation" | "approval" | "rejection" | "suspension" | "generic",
    email?: string
) => {
    const messages = {
        verification: {
            title: "✉️ Verification Email Sent!",
            description: email
                ? `We've sent a verification link to ${email}. Please check your inbox.`
                : "Check your email for the verification link.",
        },
        reset: {
            title: "🔐 Password Reset Email Sent!",
            description: email
                ? `Password reset instructions have been sent to ${email}.`
                : "Check your email for password reset instructions.",
        },
        confirmation: {
            title: "✅ Confirmation Email Sent!",
            description: "You'll receive a confirmation email shortly.",
        },
        approval: {
            title: "🎉 Approval Notification Sent!",
            description: "The business owner will be notified of their approval.",
        },
        rejection: {
            title: "📧 Rejection Notification Sent!",
            description: "The business owner will be notified.",
        },
        suspension: {
            title: "⚠️ Suspension Notification Sent!",
            description: "The business owner will be notified.",
        },
        generic: {
            title: "📧 Email Sent!",
            description: email ? `Email sent to ${email}` : "Email has been sent successfully.",
        },
    };

    const message = messages[type];

    toast({
        title: message.title,
        description: message.description,
        duration: 4000,
    });
};

/**
 * Show error toast for email failures
 */
export const showEmailErrorToast = (error?: string) => {
    toast({
        variant: "destructive",
        title: "❌ Email Failed",
        description: error || "Failed to send email. Please try again.",
        duration: 5000,
    });
};
