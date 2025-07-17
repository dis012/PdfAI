// Core data types for the PDF Table Editor application

export interface Session {
  id: string;           // UUID
  title: string;        // Display name (e.g., "Email number 1")
  created_at: string;   // ISO timestamp
}

export interface TableData {
  [key: string]: any;   // Dynamic JSON structure from backend
}

export interface TableState {
  data: TableData;
  canUndo: boolean;
  canRedo: boolean;
}

// API Request Types
export interface EditRequest {
  prompt: string;
}

// API Response Types
export interface UploadResponse {
  [key: string]: any;   // Dynamic JSON structure
}

export interface SessionsResponse {
  sessions: Session[];
}

export interface TableResponse {
  data: TableData;
}

export interface ErrorResponse {
  error: string;
}

// API Operation Result Types
export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// File Upload Types
export interface UploadFile {
  file: File;
  name: string;
  size: number;
}