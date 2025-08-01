import { APIRequestContext } from '@playwright/test';
import { BaseApiPage } from './base-api.page';
import { Cart, CreateCartRequest, UpdateCartRequest } from '../interfaces/cart.interface';
import { ApiResponse } from '../interfaces/auth.interface';

/**
 * Carts API page class handling all cart-related API operations
 */
export class CartsApiPage extends BaseApiPage {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Get all carts from the API
   * @returns Promise<ApiResponse<Cart[]>>
   */
  async getAllCarts(): Promise<ApiResponse<Cart[]>> {
    return await this.get<Cart[]>('/carts');
  }

  /**
   * Get a specific cart by ID
   * @param cartId - Cart ID to retrieve
   * @returns Promise<ApiResponse<Cart>>
   */
  async getCartById(cartId: number): Promise<ApiResponse<Cart>> {
    return await this.get<Cart>(`/carts/${cartId}`);
  }

  /**
   * Get carts for a specific user
   * @param userId - User ID to get carts for
   * @returns Promise<ApiResponse<Cart[]>>
   */
  async getCartsByUserId(userId: number): Promise<ApiResponse<Cart[]>> {
    return await this.get<Cart[]>(`/carts/user/${userId}`);
  }

  /**
   * Create a new cart
   * @param cartData - Cart data to create
   * @returns Promise<ApiResponse<Cart>>
   */
  async createCart(cartData: CreateCartRequest): Promise<ApiResponse<Cart>> {
    return await this.post<Cart>('/carts', cartData);
  }

  /**
   * Update an existing cart
   * @param cartId - Cart ID to update
   * @param cartData - Updated cart data
   * @returns Promise<ApiResponse<Cart>>
   */
  async updateCart(cartId: number, cartData: UpdateCartRequest): Promise<ApiResponse<Cart>> {
    return await this.put<Cart>(`/carts/${cartId}`, cartData);
  }

  /**
   * Delete a cart
   * @param cartId - Cart ID to delete
   * @returns Promise<ApiResponse<Cart>>
   */
  async deleteCart(cartId: number): Promise<ApiResponse<Cart>> {
    return await this.delete<Cart>(`/carts/${cartId}`);
  }

  /**
   * Get carts within a date range
   * @param startDate - Start date in YYYY-MM-DD format
   * @param endDate - End date in YYYY-MM-DD format
   * @returns Promise<ApiResponse<Cart[]>>
   */
  async getCartsByDateRange(startDate: string, endDate: string): Promise<ApiResponse<Cart[]>> {
    return await this.get<Cart[]>(`/carts?startdate=${startDate}&enddate=${endDate}`);
  }

  /**
   * Get carts with limit and sort options
   * @param limit - Number of carts to retrieve
   * @param sort - Sort order ('asc' or 'desc')
   * @returns Promise<ApiResponse<Cart[]>>
   */
  async getCartsWithLimit(limit: number, sort: 'asc' | 'desc' = 'asc'): Promise<ApiResponse<Cart[]>> {
    return await this.get<Cart[]>(`/carts?limit=${limit}&sort=${sort}`);
  }
}