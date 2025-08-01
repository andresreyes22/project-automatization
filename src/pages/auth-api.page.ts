import { APIRequestContext } from '@playwright/test';
import { BaseApiPage } from './base-api.page';
import { LoginCredentials } from '../interfaces/user.interface';
import { AuthResponse, ApiResponse } from '../interfaces/auth.interface';

/**
 * Authentication API page class handling authentication operations
 */
export class AuthApiPage extends BaseApiPage {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Login user with credentials
   * @param credentials - User login credentials
   * @returns Promise<ApiResponse<AuthResponse>>
   */
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    return await this.post<AuthResponse>('/auth/login', credentials);
  }

  /**
   * Validate token format
   * @param token - JWT token to validate
   * @returns boolean indicating if token format is valid
   */
  validateTokenFormat(token: string): boolean {
    // Basic JWT token format validation (3 parts separated by dots)
    const tokenParts = token.split('.');
    return tokenParts.length === 3 && tokenParts.every(part => part.length > 0);
  }
}