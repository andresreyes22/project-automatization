import { Product, CreateProductRequest, UpdateProductRequest } from '../interfaces/product.interface';

/**
 * Mock data for products used in testing
 */
export class ProductsMock {
  /**
   * Sample product data for testing
   */
  static readonly sampleProduct: Product = {
    id: 1,
    title: "Fjallraven - Foldsack No. 1 Backpack, Fits 15 Laptops",
    price: 109.95,
    description: "Your perfect pack for everyday use and walks in the forest.",
    category: "men's clothing",
    image: "https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg",
    rating: {
      rate: 3.9,
      count: 120
    }
  };

  /**
   * Valid product creation data
   */
  static readonly validCreateProductData: CreateProductRequest = {
    title: "Test Product",
    price: 13.5,
    description: "lorem ipsum set",
    image: "https://i.pravatar.cc",
    category: "electronic"
  };

  /**
   * Invalid product creation data (missing required fields)
   */
  static readonly invalidCreateProductData = {
    title: "Test Product",
    // Missing price, description, image, category
  };

  /**
   * Valid product update data
   */
  static readonly validUpdateProductData: UpdateProductRequest = {
    title: "Updated Test Product",
    price: 15.99,
    description: "Updated description",
    image: "https://i.pravatar.cc/150",
    category: "electronics"
  };

  /**
   * Product update data with partial fields
   */
  static readonly partialUpdateProductData: UpdateProductRequest = {
    title: "Partially Updated Product",
    price: 25.50
  };

  /**
   * Expected product categories
   */
  static readonly expectedCategories: string[] = [
    "electronics",
    "jewelery",
    "men's clothing",
    "women's clothing"
  ];

  /**
   * Required product fields for validation
   */
  static readonly requiredProductFields: string[] = [
    'id',
    'title',
    'price',
    'description',
    'category',
    'image'
  ];

  /**
   * Generate dynamic product data with random values
   */
  static generateRandomProductData(): CreateProductRequest {
    const categories = ["electronics", "jewelery", "men's clothing", "women's clothing"];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    
    return {
      title: `Test Product ${Date.now()}`,
      price: Math.round((Math.random() * 100 + 10) * 100) / 100,
      description: `Test description for product created at ${new Date().toISOString()}`,
      image: "https://i.pravatar.cc/300",
      category: randomCategory
    };
  }

  /**
   * Invalid product data with wrong data types
   */
  static readonly invalidDataTypes = {
    title: 123, // Should be string
    price: "not-a-number", // Should be number
    description: null, // Should be string
    image: true, // Should be string
    category: 456 // Should be string
  };
}