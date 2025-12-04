/**
 * Production Logger
 * Provides structured logging with different levels
 * Ready for integration with external services (Sentry, DataDog, etc.)
 */

export enum LogLevel {
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info',
    DEBUG = 'debug',
}

interface LogContext {
    userId?: string;
    requestId?: string;
    ip?: string;
    endpoint?: string;
    [key: string]: any;
}

class Logger {
    private isDevelopment: boolean;
    private minLevel: LogLevel;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV !== 'production';
        this.minLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
    }

    private shouldLog(level: LogLevel): boolean {
        const levels = [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG];
        return levels.indexOf(level) <= levels.indexOf(this.minLevel);
    }

    private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
        const timestamp = new Date().toISOString();
        const contextStr = context ? JSON.stringify(context, null, 2) : '';
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${contextStr}`;
    }

    error(message: string, error?: Error, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.ERROR)) return;

        const errorContext = {
            ...context,
            error: error ? {
                name: error.name,
                message: error.message,
                stack: this.isDevelopment ? error.stack : undefined,
            } : undefined,
        };

        if (this.isDevelopment) {
            console.error(this.formatMessage(LogLevel.ERROR, message, errorContext));
        } else {
            // In production, send to external logging service
            console.error(JSON.stringify({
                level: LogLevel.ERROR,
                message,
                timestamp: new Date().toISOString(),
                ...errorContext,
            }));

            // TODO: Integrate with Sentry/DataDog
            // e.g., Sentry.captureException(error, { contexts: errorContext });
        }
    }

    warn(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.WARN)) return;

        if (this.isDevelopment) {
            console.warn(this.formatMessage(LogLevel.WARN, message, context));
        } else {
            console.warn(JSON.stringify({
                level: LogLevel.WARN,
                message,
                timestamp: new Date().toISOString(),
                ...context,
            }));
        }
    }

    info(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.INFO)) return;

        if (this.isDevelopment) {
            console.log(this.formatMessage(LogLevel.INFO, message, context));
        } else {
            console.log(JSON.stringify({
                level: LogLevel.INFO,
                message,
                timestamp: new Date().toISOString(),
                ...context,
            }));
        }
    }

    debug(message: string, context?: LogContext): void {
        if (!this.shouldLog(LogLevel.DEBUG)) return;

        if (this.isDevelopment) {
            console.log(this.formatMessage(LogLevel.DEBUG, message, context));
        }
        // Debug logs not sent to production
    }
}

export const logger = new Logger();
