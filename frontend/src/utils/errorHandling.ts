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

export function isTableData(obj: any): obj is import('../types').TableData {
    return typeof obj === 'object' && obj !== null;
}

export function isTableState(obj: any): obj is import('../types').TableState {
    return (
        typeof obj === 'object' &&
        obj !== null &&
        'data' in obj &&
        isTableData(obj.data) &&
        typeof obj.canUndo === 'boolean' &&
        typeof obj.canRedo === 'boolean'
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
    if (typeof data === 'object' && data !== null && 'sessions' in data) {
        const sessions = (data as any).sessions;
        return validateApiResponse(sessions, isSessionArray, 'sessions');
    }

    // If data is directly an array of sessions
    return validateApiResponse(data, isSessionArray, 'sessions');
}

/**
 * Validate table data response
 */
export function validateTableResponse(data: unknown): import('../types').TableData {
    if (typeof data === 'object' && data !== null && 'data' in data) {
        const tableData = (data as any).data;
        return validateApiResponse(tableData, isTableData, 'table data');
    }

    // If data is directly table data
    return validateApiResponse(data, isTableData, 'table data');
}

/**
 * Validate table state response (includes undo/redo state)
 */
export function validateTableStateResponse(data: unknown): import('../types').TableState {
    // Check if response has the full TableState structure
    if (isTableState(data)) {
        return data;
    }

    // If response only has table data, create TableState with default undo/redo state
    if (typeof data === 'object' && data !== null && 'data' in data) {
        const tableData = (data as any).data;
        const canUndo = typeof (data as any).canUndo === 'boolean' ? (data as any).canUndo : false;
        const canRedo = typeof (data as any).canRedo === 'boolean' ? (data as any).canRedo : false;
        
        return {
            data: validateApiResponse(tableData, isTableData, 'table data'),
            canUndo,
            canRedo
        };
    }

    // If data is directly table data, wrap it in TableState
    if (isTableData(data)) {
        return {
            data: data,
            canUndo: false,
            canRedo: false
        };
    }

    throw new Error('Invalid table state response structure');
}