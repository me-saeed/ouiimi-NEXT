/**
 * Production-Ready Configuration
 * Centralized configuration management for the application
 */

export const config = {
    // Environment
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
    nodeEnv: process.env.NODE_ENV || 'development',

    // Application
    app: {
        name: 'ouiimi',
        url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
        apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    },

    // Database
    database: {
        uri: process.env.MONGODB_URI!,
        name: process.env.MONGODB_DB_NAME || 'ouiimi',
    },

    // Authentication & Security
    auth: {
        sessionSecret: process.env.SESSION_SECRET || process.env.NEXTAUTH_SECRET,
        sessionMaxAge: 7 * 24 * 60 * 60, // 7 days in seconds
        jwtSecret: process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET,
        bcryptRounds: 10,
    },

    // Rate Limiting
    rateLimit: {
        enabled: process.env.ENABLE_RATE_LIMITING !== 'false', // Enabled by default
        maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '60'),
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
        strictMaxRequests: 5, // For sensitive operations
    },

    // Stripe
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY!,
        publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },

    // Email (Mailjet)
    email: {
        apiKey: process.env.MAILJET_API_KEY,
        secretKey: process.env.MAILJET_SECRET_KEY,
        fromEmail: process.env.MAILJET_FROM_EMAIL || 'noreply@ouiimi.com',
        fromName: process.env.MAILJET_FROM_NAME || 'ouiimi',
    },

    // Google Maps
    googleMaps: {
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
    },

    // OAuth
    oauth: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
        facebook: {
            clientId: process.env.FACEBOOK_CLIENT_ID,
            clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        },
    },

    // Logging
    logging: {
        level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
        enableSessionLogging: process.env.ENABLE_SESSION_LOGGING === 'true',
    },

    // Monitoring (Optional)
    monitoring: {
        sentryDsn: process.env.SENTRY_DSN,
        logtailToken: process.env.LOGTAIL_TOKEN,
    },
} as const;

/**
 * Validate required environment variables on startup
 */
export function validateConfig(): void {
    const required = [
        'MONGODB_URI',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ];

    // Only require SESSION_SECRET in production
    if (config.isProduction && !config.auth.sessionSecret) {
        required.push('SESSION_SECRET');
    }

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(
            `Missing required environment variables: ${missing.join(', ')}\n` +
            `Please set these variables in your .env file.`
        );
    }

    // Warn about insecure configurations in production
    if (config.isProduction) {
        if (!config.auth.sessionSecret || config.auth.sessionSecret.length < 32) {
            console.warn('⚠️  WARNING: SESSION_SECRET should be at least 32 characters in production');
        }

        if (!config.app.url.startsWith('https://')) {
            console.warn('⚠️  WARNING: NEXT_PUBLIC_SITE_URL should use HTTPS in production');
        }
    }
}

/**
 * Get public configuration (safe to expose to client)
 */
export function getPublicConfig() {
    return {
        appName: config.app.name,
        appUrl: config.app.url,
        stripePublishableKey: config.stripe.publishableKey,
        googleMapsApiKey: config.googleMaps.apiKey,
        environment: config.nodeEnv,
    };
}
