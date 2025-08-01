/**
 * Authentication response interface
 */
export interface AuthResponse {
  token: string;
}

/**
 * API Response interface for error handling
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status: number;
}

/**
 * API Error interface
 */
export interface ApiError {
  message: string;
  status: number;
  details?: any;
}