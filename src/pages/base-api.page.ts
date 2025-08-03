import { APIRequestContext, expect } from '@playwright/test';
import { ApiResponse, ApiError } from '../interfaces/auth.interface';

/**
 * Base API class providing common functionality for all API endpoints
 */
export class BaseApiPage {
  protected request: APIRequestContext;
  protected baseUrl: string;

  constructor(request: APIRequestContext, baseUrl?: string) {
    this.request = request;
    // Usa BASE_URL de .env si está definida, si no, usa el valor por defecto
    this.baseUrl = baseUrl || process.env.BASE_URL || 'https://fakestoreapi.com';
  }

  /**
   * Generic GET request handler with error handling
   * @param endpoint - API endpoint
   * @param expectedStatus - Expected HTTP status code
   * @returns Promise<ApiResponse>
   */
  protected async get<T>(endpoint: string, expectedStatus: number = 200): Promise<ApiResponse<T>> {
    try {
      const response = await this.request.get(`${this.baseUrl}${endpoint}`);
      const data = await response.json();
      
      return {
        success: response.status() === expectedStatus,
        data: data,
        status: response.status()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic POST request handler with error handling
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param expectedStatus - Expected HTTP status code
   * @returns Promise<ApiResponse>
   */
  protected async post<T>(endpoint: string, body: any, expectedStatus: number = 200): Promise<ApiResponse<T>> {
    try {
      const response = await this.request.post(`${this.baseUrl}${endpoint}`, {
        json: body
      } as any);
      const data = await response.json();
      return {
        success: response.status() === expectedStatus,
        data: data,
        status: response.status()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic PUT request handler with error handling
   * @param endpoint - API endpoint
   * @param body - Request body
   * @param expectedStatus - Expected HTTP status code
   * @returns Promise<ApiResponse>
   */
  protected async put<T>(endpoint: string, body: any, expectedStatus: number = 200): Promise<ApiResponse<T>> {
    try {
      const response = await this.request.put(`${this.baseUrl}${endpoint}`, {
        json: body
      } as any);
      const data = await response.json();
      return {
        success: response.status() === expectedStatus,
        data: data,
        status: response.status()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Generic DELETE request handler with error handling
   * @param endpoint - API endpoint
   * @param expectedStatus - Expected HTTP status code
   * @returns Promise<ApiResponse>
   */
  protected async delete<T>(endpoint: string, expectedStatus: number = 200): Promise<ApiResponse<T>> {
    try {
      const response = await this.request.delete(`${this.baseUrl}${endpoint}`);
      const data = await response.json();
      
      return {
        success: response.status() === expectedStatus,
        data: data,
        status: response.status()
      };
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Error handler for API requests
   * @param error - Error object
   * @returns ApiResponse with error details
   */
  private handleError(error: any): ApiResponse {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
      status: error.status || 500
    };
  }

  /**
   * Validates the structure of a response object
   * @param response - Response object to validate
   * @param requiredFields - Array of required field names
   */
  protected validateResponseStructure(response: any, requiredFields: string[]): void {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    
    requiredFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  }

  /**
   * Validates array response structure
   * @param response - Array response to validate
   * @param expectedLength - Expected minimum length (optional)
   */
  protected validateArrayResponse(response: any[], expectedLength?: number): void {
    expect(Array.isArray(response)).toBeTruthy();
    if (expectedLength !== undefined) {
      expect(response.length).toBeGreaterThanOrEqual(expectedLength);
    }
  }
}