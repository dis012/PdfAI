// Core data types for the PDF Table Editor application

export interface Session {
  id: string;           // UUID
  title: string;        // Display name (e.g., "Email number 1")
  created_at: string;   // ISO timestamp
}

export interface TableRow {
  field: string;        // Display name (e.g., "Student Name")
  value: any;          // The actual value
}

export interface TableData {
  table_rows: TableRow[];     // Formatted table rows
  version_number: number;     // Current version
  can_undo: boolean;         // Whether undo is available
  can_redo: boolean;         // Whether redo is available
}

export interface TableState {
  rows: TableRow[];
  canUndo: boolean;
  canRedo: boolean;
  versionNumber: number;
}

// API Request Types
export interface EditRequest {
  prompt: string;
}

// API Response Types
export interface UploadResponse {
  session_id: string;
  title: string;
  table_rows: TableRow[];
}

export interface SessionsResponse extends Array<Session> {}

export interface TableResponse {
  table_rows: TableRow[];
  version_number: number;
  can_undo: boolean;
  can_redo: boolean;
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