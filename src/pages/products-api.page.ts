import { APIRequestContext } from '@playwright/test';
import { BaseApiPage } from './base-api.page';
import { Product, CreateProductRequest, UpdateProductRequest, ProductCategory } from '../interfaces/product.interface';
import { ApiResponse } from '../interfaces/auth.interface';

/**
 * Products API page class handling all product-related API operations
 */
export class ProductsApiPage extends BaseApiPage {
  constructor(request: APIRequestContext) {
    super(request);
  }

  /**
   * Get all products from the API
   * @returns Promise<ApiResponse<Product[]>>
   */
  async getAllProducts(): Promise<ApiResponse<Product[]>> {
    return await this.get<Product[]>('/products');
  }

  /**
   * Get a specific product by ID
   * @param productId - Product ID to retrieve
   * @returns Promise<ApiResponse<Product>>
   */
  async getProductById(productId: number): Promise<ApiResponse<Product>> {
    return await this.get<Product>(`/products/${productId}`);
  }

  /**
   * Get products by category
   * @param category - Product category
   * @returns Promise<ApiResponse<Product[]>>
   */
  async getProductsByCategory(category: ProductCategory): Promise<ApiResponse<Product[]>> {
    return await this.get<Product[]>(`/products/category/${category}`);
  }

  /**
   * Get all product categories
   * @returns Promise<ApiResponse<string[]>>
   */
  async getAllCategories(): Promise<ApiResponse<string[]>> {
    return await this.get<string[]>('/products/categories');
  }

  /**
   * Create a new product
   * @param productData - Product data to create
   * @returns Promise<ApiResponse<Product>>
   */
  async createProduct(productData: CreateProductRequest): Promise<ApiResponse<Product>> {
    return await this.post<Product>('/products', productData);
  }

  /**
   * Update an existing product
   * @param productId - Product ID to update
   * @param productData - Updated product data
   * @returns Promise<ApiResponse<Product>>
   */
  async updateProduct(productId: number, productData: UpdateProductRequest): Promise<ApiResponse<Product>> {
    return await this.put<Product>(`/products/${productId}`, productData);
  }

  /**
   * Delete a product
   * @param productId - Product ID to delete
   * @returns Promise<ApiResponse<Product>>
   */
  async deleteProduct(productId: number): Promise<ApiResponse<Product>> {
    return await this.delete<Product>(`/products/${productId}`);
  }

  /**
   * Get products with limit and sort options
   * @param limit - Number of products to retrieve
   * @param sort - Sort order ('asc' or 'desc')
   * @returns Promise<ApiResponse<Product[]>>
   */
  async getProductsWithLimit(limit: number, sort: 'asc' | 'desc' = 'asc'): Promise<ApiResponse<Product[]>> {
    return await this.get<Product[]>(`/products?limit=${limit}&sort=${sort}`);
  }
}