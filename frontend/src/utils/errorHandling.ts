import { ApiError } from '../services/api';

// Error types for different categories of errors
export enum ErrorType {
    NETWORK = 'NETWORK',
    VALIDATION = 'VALIDATION',
    SERVER = 'SERVER',
    FILE_UPLOAD = 'FILE_UPLOAD',
    UNKNOWN = 'UNKNOWN'
}

// Error severity levels
export enum ErrorSeverity {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH',
    CRITICAL = 'CRITICAL'
}

// Structured error information
export interface ErrorInfo {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    retryable: boolean;
    originalError?: Error;
}

/**
 * Categorize and format errors for user display
 */
export function categorizeError(error: unknown): ErrorInfo {
    // Handle API errors
    if (error instanceof ApiError) {
        const status = error.status;

        if (status === 400) {
            return {
                type: ErrorType.VALIDATION,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'Invalid request. Please check your input and try again.',
                retryable: false,
                originalError: error
            };
        }

        if (status === 404) {
            return {
                type: ErrorType.SERVER,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'The requested resource was not found.',
                retryable: false,
                originalError: error
            };
        }

        if (status && status >= 500) {
            return {
                type: ErrorType.SERVER,
                severity: ErrorSeverity.HIGH,
                message: error.message,
                userMessage: 'Server error. Please try again later.',
                retryable: true,
                originalError: error
            };
        }

        // Network or timeout errors
        if (error.message.includes('timeout') || error.message.includes('network')) {
            return {
                type: ErrorType.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'Network error. Please check your connection and try again.',
                retryable: true,
                originalError: error
            };
        }
    }

    // Handle file upload specific errors
    if (error instanceof Error) {
        const message = error.message.toLowerCase();

        if (message.includes('file') && (message.includes('size') || message.includes('type'))) {
            return {
                type: ErrorType.FILE_UPLOAD,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: error.message,
                retryable: false,
                originalError: error
            };
        }

        if (message.includes('network') || message.includes('fetch')) {
            return {
                type: ErrorType.NETWORK,
                severity: ErrorSeverity.MEDIUM,
                message: error.message,
                userMessage: 'Network error. Please check your connection and try again.',
                retryable: true,
                originalError: error
            };
        }
    }

    // Default unknown error
    return {
        type: ErrorType.UNKNOWN,
        severity: ErrorSeverity.MEDIUM,
        message: error instanceof Error ? error.message : 'Unknown error',
        userMessage: 'An unexpected error occurred. Please try again.',
        retryable: true,
        originalError: error instanceof Error ? error : undefined
    };
}

/**
 * Validate file before upload
 */
export function validateFile(file: File): ErrorInfo | null {
    // Check file type
    if (file.type !== 'application/pdf') {
        return {
            type: ErrorType.FILE_UPLOAD,
            severity: ErrorSeverity.MEDIUM,
            message: `Invalid file type: ${file.type}`,
            userMessage: 'Only PDF files are allowed.',
            retryable: false
        };
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
        return {
            type: ErrorType.FILE_UPLOAD,
            severity: ErrorSeverity.MEDIUM,
            message: `File size ${file.size} exceeds limit ${maxSize}`,
            userMessage: 'File size exceeds 50MB limit.',
            retryable: false
        };
    }

    // Check if file is empty
    if (file.size === 0) {
        return {
            type: ErrorType.FILE_UPLOAD,
            severity: ErrorSeverity.MEDIUM,
            message: 'File is empty',
            userMessage: 'The selected file is empty.',
            retryable: false
        };
    }

    return null; // File is valid
}

/**
 * Format error message for display to users
 */
export function formatErrorMessage(error: unknown): string {
    const errorInfo = categorizeError(error);
    return errorInfo.userMessage;
}

/**
 * Check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
    const errorInfo = categorizeError(error);
    return errorInfo.retryable;
}

/**
 * Log error for debugging (always logs in development builds)
 */
export function logError(error: unknown, context?: string): void {
    // Always log errors in development for debugging
    const errorInfo = categorizeError(error);
    console.group(`🚨 Error${context ? ` in ${context}` : ''}`);
    console.error('Type:', errorInfo.type);
    console.error('Severity:', errorInfo.severity);
    console.error('Message:', errorInfo.message);
    console.error('User Message:', errorInfo.userMessage);
    console.error('Retryable:', errorInfo.retryable);
    if (errorInfo.originalError) {
        console.error('Original Error:', errorInfo.originalError);
    }
    console.groupEnd();
}

/**
 * Type validation utilities for API responses
 */

// Type guards for runtime type checking
export function isSession(obj: any): obj is import('../types').Session {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.id === 'string' &&
        typeof obj.title === 'string' &&
        typeof obj.created_at === 'string'
    );
}

export function isSessionArray(obj: any): obj is import('../types').Session[] {
    return Array.isArray(obj) && obj.every(isSession);
}

export function isTableRow(obj: any): obj is import('../types').TableRow {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.field === 'string' &&
        obj.value !== undefined
    );
}

export function isTableData(obj: any): obj is import('../types').TableData {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        Array.isArray(obj.table_rows) &&
        obj.table_rows.every(isTableRow) &&
        typeof obj.version_number === 'number' &&
        typeof obj.can_undo === 'boolean' &&
        typeof obj.can_redo === 'boolean'
    );
}

export function isTableState(obj: any): obj is import('../types').TableState {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        Array.isArray(obj.rows) &&
        obj.rows.every(isTableRow) &&
        typeof obj.canUndo === 'boolean' &&
        typeof obj.canRedo === 'boolean' &&
        typeof obj.versionNumber === 'number'
    );
}

export function isErrorResponse(obj: any): obj is import('../types').ErrorResponse {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        typeof obj.error === 'string'
    );
}

/**
 * Validate API response structure
 */
export function validateApiResponse<T>(
    data: unknown,
    validator: (obj: any) => obj is T,
    context: string
): T {
    if (!validator(data)) {
        throw new Error(`Invalid ${context} response structure`);
    }
    return data;
}

/**
 * Validate session response
 */
export function validateSessionsResponse(data: unknown): import('../types').Session[] {
    // Backend now returns array directly
    return validateApiResponse(data, isSessionArray, 'sessions');
}

/**
 * Validate table data response
 */
export function validateTableResponse(data: unknown): import('../types').TableData {
    return validateApiResponse(data, isTableData, 'table data');
}

/**
 * Validate table state response and convert to frontend format
 */
export function validateTableStateResponse(data: unknown): import('../types').TableState {
    // Validate the backend response structure
    const validatedData = validateApiResponse(data, isTableData, 'table data');
    
    // Convert backend format to frontend format
    return {
        rows: validatedData.table_rows,
        canUndo: validatedData.can_undo,
        canRedo: validatedData.can_redo,
        versionNumber: validatedData.version_number
    };
}