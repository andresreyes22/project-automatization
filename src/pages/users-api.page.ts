import { APIRequestContext } from '@playwright/test';
import { BaseApiPage } from './base-api.page';
import { User, CreateUserRequest } from '../interfaces/user.interface';
import { ApiResponse } from '../interfaces/auth.interface';

/**
 * Users API page class handling all user-related API operations
 */
export class UsersApiPage extends BaseApiPage {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Get all users from the API
   * @returns Promise<ApiResponse<User[]>>
   */
  async getAllUsers(): Promise<ApiResponse<User[]>> {
    return await this.get<User[]>('/users');
  }

  /**
   * Get a specific user by ID
   * @param userId - User ID to retrieve
   * @returns Promise<ApiResponse<User>>
   */
  async getUserById(userId: number): Promise<ApiResponse<User>> {
    return await this.get<User>(`/users/${userId}`);
  }

  /**
   * Create a new user
   * @param userData - User data to create
   * @returns Promise<ApiResponse<User>>
   */
  async createUser(userData: CreateUserRequest): Promise<ApiResponse<User>> {
    return await this.post<User>('/users', userData);
  }

  /**
   * Update an existing user
   * @param userId - User ID to update
   * @param userData - Updated user data
   * @returns Promise<ApiResponse<User>>
   */
  async updateUser(userId: number, userData: Partial<CreateUserRequest>): Promise<ApiResponse<User>> {
    return await this.put<User>(`/users/${userId}`, userData);
  }

  /**
   * Delete a user
   * @param userId - User ID to delete
   * @returns Promise<ApiResponse<User>>
   */
  async deleteUser(userId: number): Promise<ApiResponse<User>> {
    return await this.delete<User>(`/users/${userId}`);
  }

  /**
   * Get users with limit and sort options
   * @param limit - Number of users to retrieve
   * @param sort - Sort order ('asc' or 'desc')
   * @returns Promise<ApiResponse<User[]>>
   */
  async getUsersWithLimit(limit: number, sort: 'asc' | 'desc' = 'asc'): Promise<ApiResponse<User[]>> {
    return await this.get<User[]>(`/users?limit=${limit}&sort=${sort}`);
  }
}