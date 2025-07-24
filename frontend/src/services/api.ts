import {
  Session,
  TableData,
  TableState,
  EditRequest,
  UploadResponse,
  SessionsResponse,
  TableResponse,
  ErrorResponse,
  ApiResult,
  UploadFile
} from '../types';
import {
  validateSessionsResponse,
  validateTableResponse,
  validateTableStateResponse,
  logError
} from '../utils/errorHandling';
import { retryApiCall } from '../utils/retryMechanism';

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api';

// Request timeout in milliseconds
const REQUEST_TIMEOUT = 30000;

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Utility function to create fetch request with timeout
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timeout');
    }
    throw error;
  }
}

// Generic API request handler with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResult<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetchWithTimeout(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    // Handle HTTP error status codes
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

      try {
        const errorData: ErrorResponse = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch {
        // If error response is not JSON, use status text
      }

      throw new ApiError(errorMessage, response.status);
    }

    // Parse JSON response
    const data: T = await response.json();
    return { success: true, data };

  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);

    if (error instanceof ApiError) {
      return { success: false, error: error.message };
    }

    if (error instanceof Error) {
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Unknown error occurred' };
  }
}

// API Service Functions

/**
 * Upload a PDF file to the backend
 */
export async function uploadFile(uploadFile: UploadFile): Promise<ApiResult<UploadResponse>> {
  const retryResult = await retryApiCall(
    async () => {
      const formData = new FormData();
      formData.append('pdf', uploadFile.file); // Changed from 'file' to 'pdf'

      const response = await fetchWithTimeout(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - let browser set it with boundary for multipart
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: HTTP ${response.status}`;

        try {
          const errorData: ErrorResponse = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If error response is not JSON, use status text
        }

        throw new ApiError(errorMessage, response.status);
      }

      const data: UploadResponse = await response.json();
      return { success: true, data };
    },
    {
      maxAttempts: 2, // Fewer retries for file uploads to avoid duplicate uploads
      baseDelay: 2000,
      onRetry: (attempt) => {
        console.log(`Retrying file upload (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}

/**
 * Retrieve all sessions from the backend
 */
export async function getSessions(): Promise<ApiResult<Session[]>> {
  const retryResult = await retryApiCall(
    async () => {
      const result = await apiRequest<any>('/sessions');
      if (result.success && result.data) {
        const validatedSessions = validateSessionsResponse(result.data);
        return { success: true, data: validatedSessions };
      }
      return { success: false, error: result.error };
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      onRetry: (attempt) => {
        console.log(`Retrying getSessions (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}

/**
 * Get table data for a specific session
 */
export async function getTableData(sessionId: string): Promise<ApiResult<TableState>> {
  const retryResult = await retryApiCall(
    async () => {
      const result = await apiRequest<any>(`/tables/${sessionId}`);
      if (result.success && result.data) {
        const validatedTableState = validateTableStateResponse(result.data);
        return { success: true, data: validatedTableState };
      }
      return { success: false, error: result.error };
    },
    {
      maxAttempts: 3,
      baseDelay: 1000,
      onRetry: (attempt) => {
        console.log(`Retrying getTableData for session ${sessionId} (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}

/**
 * Update table data with a natural language prompt
 */
export async function editTable(
  sessionId: string,
  prompt: string
): Promise<ApiResult<TableState>> {
  const retryResult = await retryApiCall(
    async () => {
      const editRequest: EditRequest = { prompt };
      const result = await apiRequest<any>(`/tables/${sessionId}`, {
        method: 'PUT',
        body: JSON.stringify(editRequest),
      });

      if (result.success && result.data) {
        const validatedTableState = validateTableStateResponse(result.data);
        return { success: true, data: validatedTableState };
      }
      return { success: false, error: result.error };
    },
    {
      maxAttempts: 2, // Fewer retries for edit operations to avoid duplicate edits
      baseDelay: 1500,
      onRetry: (attempt) => {
        console.log(`Retrying editTable for session ${sessionId} (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}

/**
 * Undo the last table modification
 */
export async function undoTableEdit(sessionId: string): Promise<ApiResult<TableState>> {
  const retryResult = await retryApiCall(
    async () => {
      const result = await apiRequest<any>(`/tables/undo/${sessionId}`, {
        method: 'PUT',
      });

      if (result.success && result.data) {
        const validatedTableState = validateTableStateResponse(result.data);
        return { success: true, data: validatedTableState };
      }
      return { success: false, error: result.error };
    },
    {
      maxAttempts: 2, // Fewer retries for undo operations
      baseDelay: 1000,
      onRetry: (attempt) => {
        console.log(`Retrying undoTableEdit for session ${sessionId} (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}

/**
 * Redo a previously undone table modification
 */
export async function redoTableEdit(sessionId: string): Promise<ApiResult<TableState>> {
  const retryResult = await retryApiCall(
    async () => {
      const result = await apiRequest<any>(`/tables/redo/${sessionId}`, {
        method: 'PUT',
      });

      if (result.success && result.data) {
        const validatedTableState = validateTableStateResponse(result.data);
        return { success: true, data: validatedTableState };
      }
      return { success: false, error: result.error };
    },
    {
      maxAttempts: 2, // Fewer retries for redo operations
      baseDelay: 1000,
      onRetry: (attempt) => {
        console.log(`Retrying redoTableEdit for session ${sessionId} (attempt ${attempt + 1})`);
      }
    }
  );

  return {
    success: retryResult.success,
    data: retryResult.data,
    error: retryResult.error
  };
}