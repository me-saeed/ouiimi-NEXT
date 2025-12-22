/**
 * =============================================================================
 * ENVIRONMENT VARIABLE VALIDATOR
 * =============================================================================
 * 
 * Validates required environment variables on application startup.
 * Provides clear error messages for missing or invalid configuration.
 */

interface EnvConfig {
    // Database
    MONGODB_URI: string;

    // Authentication
    SESSION_SECRET: string;
    JWT_SECRET: string;

    // Stripe (Production)
    STRIPE_SECRET_KEY: string;
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;

    // Email Service
    MAILJET_API_KEY: string;
    MAILJET_SECRET_KEY: string;

    // Application
    NEXT_PUBLIC_SITE_URL: string;
    NODE_ENV: string;
}

interface OptionalEnvConfig {
    // OAuth (Optional)
    GOOGLE_CLIENT_ID?: string;
    GOOGLE_CLIENT_SECRET?: string;
    FACEBOOK_CLIENT_ID?: string;
    FACEBOOK_CLIENT_SECRET?: string;

    // Monitoring (Optional but recommended)
    SENTRY_DSN?: string;
    LOGTAIL_TOKEN?: string;

    // Maps
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
}

class EnvironmentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "EnvironmentError";
    }
}

/**
 * Validate required environment variables
 */
export function validateEnvironment(): EnvConfig {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required variables
    const requiredVars: (keyof EnvConfig)[] = [
        'MONGODB_URI',
        'SESSION_SECRET',
        'JWT_SECRET',
        'STRIPE_SECRET_KEY',
        'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
        'MAILJET_API_KEY',
        'MAILJET_SECRET_KEY',
        'NEXT_PUBLIC_SITE_URL',
    ];

    // Check required variables
    requiredVars.forEach((varName) => {
        const value = process.env[varName];
        if (!value || value.trim() === '') {
            errors.push(`Missing required environment variable: ${varName}`);
        }
    });

    // Validate specific formats
    if (process.env.MONGODB_URI && !process.env.MONGODB_URI.startsWith('mongodb')) {
        errors.push('MONGODB_URI must start with mongodb:// or mongodb+srv://');
    }

    if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
        errors.push('SESSION_SECRET must be at least 32 characters long');
    }

    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
        errors.push('JWT_SECRET must be at least 32 characters long');
    }

    if (process.env.NEXT_PUBLIC_SITE_URL && !process.env.NEXT_PUBLIC_SITE_URL.startsWith('http')) {
        errors.push('NEXT_PUBLIC_SITE_URL must start with http:// or https://');
    }

    // Production-specific validations
    if (process.env.NODE_ENV === 'production') {
        if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
            warnings.push('⚠️  Using test Stripe keys in production (should start with sk_live_)');
        }

        if (process.env.NEXT_PUBLIC_SITE_URL?.includes('localhost')) {
            warnings.push('⚠️  NEXT_PUBLIC_SITE_URL contains localhost in production');
        }

        if (!process.env.SENTRY_DSN) {
            warnings.push('⚠️  SENTRY_DSN not configured - error tracking disabled');
        }
    }

    // Optional but recommended
    const recommendedVars: (keyof OptionalEnvConfig)[] = [
        'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
        'SENTRY_DSN',
    ];

    recommendedVars.forEach((varName) => {
        if (!process.env[varName]) {
            warnings.push(`Recommended environment variable missing: ${varName}`);
        }
    });

    // Print warnings
    if (warnings.length > 0) {
        console.warn('\n⚠️  Environment Warnings:');
        warnings.forEach(warning => console.warn(`  ${warning}`));
        console.warn('');
    }

    // Throw if there are errors
    if (errors.length > 0) {
        const errorMessage = [
            '\n❌ Environment Validation Failed!',
            '',
            'Missing or invalid environment variables:',
            ...errors.map(e => `  • ${e}`),
            '',
            'Please check your .env.local file or environment configuration.',
            'See .env.production.example for reference.',
            ''
        ].join('\n');

        throw new EnvironmentError(errorMessage);
    }

    console.log('✅ Environment variables validated successfully');

    return process.env as unknown as EnvConfig;
}

/**
 * Get validated environment config
 */
export function getEnvConfig(): EnvConfig {
    if (!globalThis.__envConfig) {
        globalThis.__envConfig = validateEnvironment();
    }
    return globalThis.__envConfig;
}

// Type augmentation for global
declare global {
    var __envConfig: EnvConfig | undefined;
}

// Auto-validate on import (only in Node.js environment)
if (typeof window === 'undefined') {
    try {
        validateEnvironment();
    } catch (error) {
        if (error instanceof EnvironmentError) {
            console.error(error.message);
            // In production, exit the process
            if (process.env.NODE_ENV === 'production') {
                process.exit(1);
            }
        }
    }
}
