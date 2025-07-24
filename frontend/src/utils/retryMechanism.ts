import { isRetryableError, logError } from './errorHandling';

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryCondition?: (error: unknown) => boolean;
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryCondition = isRetryableError,
    onRetry
  } = options;

  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await fn();
      return {
        success: true,
        data: result,
        attempts: attempt
      };
    } catch (error) {
      lastError = error;
      
      // Log the error
      logError(error, `retryWithBackoff (attempt ${attempt}/${maxAttempts})`);
      
      // Check if we should retry
      if (attempt === maxAttempts || !retryCondition(error)) {
        break;
      }
      
      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffMultiplier, attempt - 1),
        maxDelay
      );
      
      // Add some jitter to prevent thundering herd
      const jitteredDelay = delay + Math.random() * 1000;
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, jitteredDelay));
    }
  }
  
  return {
    success: false,
    error: lastError instanceof Error ? lastError.message : 'Unknown error',
    attempts: maxAttempts
  };
}

/**
 * Retry specifically for API calls
 */
export async function retryApiCall<T>(
  apiCall: () => Promise<{ success: boolean; data?: T; error?: string }>,
  options: RetryOptions = {}
): Promise<{ success: boolean; data?: T; error?: string; attempts: number }> {
  const result = await retryWithBackoff(
    async () => {
      const apiResult = await apiCall();
      if (!apiResult.success) {
        throw new Error(apiResult.error || 'API call failed');
      }
      return apiResult.data;
    },
    {
      ...options,
      retryCondition: (error) => {
        // Custom retry condition for API calls
        if (error instanceof Error) {
          const message = error.message.toLowerCase();
          // Retry on network errors, timeouts, and 5xx server errors
          return message.includes('network') || 
                 message.includes('timeout') || 
                 message.includes('fetch') ||
                 message.includes('500') ||
                 message.includes('502') ||
                 message.includes('503') ||
                 message.includes('504');
        }
        return false;
      }
    }
  );

  return {
    success: result.success,
    data: result.data,
    error: result.error,
    attempts: result.attempts
  };
}

/**
 * Create a retry wrapper for a function
 */
export function createRetryWrapper<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  return async (...args: T): Promise<RetryResult<R>> => {
    return retryWithBackoff(() => fn(...args), options);
  };
}

/**
 * Retry with user feedback
 */
export async function retryWithUserFeedback<T>(
  fn: () => Promise<T>,
  options: RetryOptions & {
    showToast?: (message: string, type: string) => void;
    operationName?: string;
  } = {}
): Promise<RetryResult<T>> {
  const { showToast, operationName = 'operation', ...retryOptions } = options;

  return retryWithBackoff(fn, {
    ...retryOptions,
    onRetry: (attempt, error) => {
      if (showToast) {
        showToast(
          `${operationName} failed. Retrying... (attempt ${attempt + 1})`,
          'warning'
        );
      }
      if (options.onRetry) {
        options.onRetry(attempt, error);
      }
    }
  });
}