/**
 * Safe Error Handling Utility
 * 
 * This module provides secure error handling that prevents
 * sensitive information leakage to end users.
 * 
 * Fixes vulnerabilities:
 * - #7 Error Message Information Leakage
 * - #12 Credentials in Error Messages
 */

// Map of database/API error codes to user-friendly messages
const ERROR_MESSAGES = {
    // PostgreSQL errors
    '23505': 'This record already exists.',
    '23503': 'Cannot complete this action due to related data.',
    '23514': 'The provided data does not meet requirements.',
    '42501': 'You do not have permission to perform this action.',
    '42P01': 'The requested resource was not found.',
    '22P02': 'Invalid input format.',
    '22001': 'Input value is too long.',
    '22003': 'Numeric value out of range.',

    // Supabase PostgREST errors
    'PGRST116': 'No matching records found.',
    'PGRST301': 'Row limit exceeded.',
    'PGRST000': 'Unable to connect to the database.',

    // Auth errors
    'invalid_credentials': 'Invalid email or password.',
    'email_not_confirmed': 'Please verify your email address.',
    'user_not_found': 'Account not found.',
    'invalid_grant': 'Invalid login credentials.',
    'email_exists': 'An account with this email already exists.',
    'weak_password': 'Password is too weak. Please use a stronger password.',
    'over_request_rate_limit': 'Too many requests. Please try again later.',
    'over_email_send_rate_limit': 'Too many emails sent. Please try again later.',

    // HTTP status codes
    '400': 'Invalid request. Please check your input.',
    '401': 'Please log in to continue.',
    '403': 'You do not have permission to perform this action.',
    '404': 'The requested resource was not found.',
    '409': 'This action conflicts with existing data.',
    '422': 'Invalid data provided.',
    '429': 'Too many requests. Please try again later.',
    '500': 'An unexpected error occurred. Please try again.',
    '502': 'Service temporarily unavailable. Please try again.',
    '503': 'Service temporarily unavailable. Please try again.',

    // Default fallback
    'default': 'An unexpected error occurred. Please try again.',
};

/**
 * Get a safe, user-friendly error message from an error object
 * Never exposes internal error details, SQL queries, or stack traces
 * 
 * @param {Error|Object} error - The error object from Supabase or API
 * @returns {string} A safe, user-friendly error message
 */
export function getSafeErrorMessage(error) {
    if (!error) return ERROR_MESSAGES.default;

    // Check for error code (database errors)
    const code = error.code || error.status?.toString() || error.statusCode?.toString();

    if (code && ERROR_MESSAGES[code]) {
        return ERROR_MESSAGES[code];
    }

    // Check for Supabase Auth specific errors
    if (error.message) {
        const lowerMessage = error.message.toLowerCase();

        // Map common auth error patterns to safe messages
        if (lowerMessage.includes('invalid login credentials')) {
            return ERROR_MESSAGES.invalid_credentials;
        }
        if (lowerMessage.includes('email not confirmed')) {
            return ERROR_MESSAGES.email_not_confirmed;
        }
        if (lowerMessage.includes('user not found') || lowerMessage.includes('no user')) {
            return ERROR_MESSAGES.user_not_found;
        }
        if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
            return ERROR_MESSAGES.over_request_rate_limit;
        }
        if (lowerMessage.includes('already registered') || lowerMessage.includes('already exists')) {
            return ERROR_MESSAGES.email_exists;
        }
        if (lowerMessage.includes('password')) {
            return ERROR_MESSAGES.weak_password;
        }
    }

    // Check for HTTP status
    if (error.status && ERROR_MESSAGES[error.status.toString()]) {
        return ERROR_MESSAGES[error.status.toString()];
    }

    return ERROR_MESSAGES.default;
}

/**
 * Log error safely in development, suppress details in production
 * 
 * @param {string} context - Where the error occurred
 * @param {Error|Object} error - The error object
 */
export function logError(context, error) {
    if (import.meta.env.DEV) {
        console.error(`[${context}]`, error);
    } else {
        // In production, log only a reference, not the full error
        console.error(`[${context}] Error occurred - check server logs for details`);
    }
}

/**
 * Handle API/database errors with safe user feedback
 * 
 * @param {Error|Object} error - The error object
 * @param {string} context - Context for logging
 * @param {Function} setError - State setter for error message (optional)
 * @returns {string} Safe error message
 */
export function handleError(error, context = 'Operation', setError = null) {
    logError(context, error);
    const safeMessage = getSafeErrorMessage(error);

    if (setError && typeof setError === 'function') {
        setError(safeMessage);
    }

    return safeMessage;
}

/**
 * Wrap async operations with safe error handling
 * 
 * @param {Function} operation - Async function to execute
 * @param {Object} options - Options for error handling
 * @returns {Promise<{data: any, error: string|null}>}
 */
export async function safeAsync(operation, options = {}) {
    const { context = 'Operation', onError = null } = options;

    try {
        const result = await operation();
        return { data: result, error: null };
    } catch (error) {
        const safeMessage = handleError(error, context, onError);
        return { data: null, error: safeMessage };
    }
}

// Export for use in components
export default {
    getSafeErrorMessage,
    logError,
    handleError,
    safeAsync,
};
