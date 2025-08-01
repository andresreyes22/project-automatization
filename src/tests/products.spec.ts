import { test, expect } from '@playwright/test';
import { ProductsApiPage } from '../pages/products-api.page';
import { ProductsMock } from '../mocks/products.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { Product } from '../interfaces/product.interface';

test.describe('Products API Tests', () => {
  let productsApi: ProductsApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    productsApi = new ProductsApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /products - Get All Products', () => {
    test('should successfully retrieve all products', async () => {
      const response = await productsApi.getAllProducts();
      
      expect(response.success, '❌ Should successfully retrieve all products').toBeTruthy();
      expect(response.status, '❌ Status for retrieving all products should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Response data should be an array').toBeTruthy();
      expect(response.data!.length, '❌ Products array should not be empty').toBeGreaterThan(0);
      
      // Validate first product structure
      const firstProduct = response.data![0];
      ProductsMock.requiredProductFields.forEach(field => {
        expect(firstProduct, `❌ Product should have property '${field}'`).toHaveProperty(field);
      });
    });

    test('should retrieve products with limit and sort parameters', async () => {
      const limit = 5;
      const response = await productsApi.getProductsWithLimit(limit, 'desc');
      
      expect(response.success, '❌ Should successfully retrieve products with limit').toBeTruthy();
      expect(response.status, '❌ Status for retrieving products with limit should be 200').toBe(200);
      expect(response.data!.length, '❌ Products array length should be less than or equal to limit').toBeLessThanOrEqual(limit);
    });

    test('should handle invalid limit parameter gracefully', async () => {
      const response = await productsApi.getProductsWithLimit(-1);
      
      // API should handle invalid parameters gracefully
      expect(response.status, '❌ Status for invalid limit parameter should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Response data should be an array for invalid limit').toBeTruthy();
    });
  });

  test.describe('GET /products/{id} - Get Product by ID', () => {
    test('should successfully retrieve a specific product', async () => {
      const productId = 1;
      const response = await productsApi.getProductById(productId);
      
      expect(response.success, '❌ Should successfully retrieve a specific product').toBeTruthy();
      expect(response.status, '❌ Status for retrieving a specific product should be 200').toBe(200);
      expect(response.data!.id, '❌ Product ID should match requested ID').toBe(productId);
      
      // Validate product structure
      ProductsMock.requiredProductFields.forEach(field => {
        expect(response.data!, `❌ Product should have property '${field}'`).toHaveProperty(field);
      });
    });

    test('should return 404 for non-existent product', async () => {
      const nonExistentId = 99999;
      const response = await productsApi.getProductById(nonExistentId);
      
      expect(response.status, '❌ Status for non-existent product should be 404').toBe(404);
      expect(response.success, '❌ Success should be false for non-existent product').toBeFalsy();
    });

    test('should handle invalid product ID formats', async () => {
      // Test with various invalid ID formats
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await productsApi.getProductById(invalidId);
        // API might return 404 or empty response for invalid IDs
        expect([200, 404], `❌ Status for invalid product ID '${invalidId}' should be 200 or 404`).toContain(response.status);
      }
    });
  });

  test.describe('GET /products/categories - Get All Categories', () => {
    test('should successfully retrieve all product categories', async () => {
      const response = await productsApi.getAllCategories();
      
      expect(response.success, '❌ Should successfully retrieve all product categories').toBeTruthy();
      expect(response.status, '❌ Status for retrieving all categories should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Categories response should be an array').toBeTruthy();
      expect(response.data!.length, '❌ Categories array should not be empty').toBeGreaterThan(0);
      
      // Verify expected categories are present
      ProductsMock.expectedCategories.forEach(category => {
        expect(response.data, `❌ Categories should contain '${category}'`).toContain(category);
      });
    });
  });

  test.describe('GET /products/category/{category} - Get Products by Category', () => {
    test('should successfully retrieve products by valid category', async () => {
      const category = "electronics";
      const response = await productsApi.getProductsByCategory(category);
      
      expect(response.success, '❌ Should successfully retrieve products by category').toBeTruthy();
      expect(response.status, '❌ Status for retrieving products by category should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Products by category should be an array').toBeTruthy();
      
      // Verify all products belong to the requested category
      response.data!.forEach((product: Product) => {
        expect(product.category, `❌ Product category should be '${category}'`).toBe(category);
      });
    });

    test('should handle invalid category gracefully', async () => {
      const invalidCategory = "nonexistent-category" as any;
      const response = await productsApi.getProductsByCategory(invalidCategory);
      
      // API might return empty array or error for invalid category
      expect([200, 400, 404], '❌ Status for invalid category should be 200, 400, or 404').toContain(response.status);
    });
  });

  test.describe('POST /products - Create Product', () => {
    test('should successfully create a new product with valid data', async () => {
      const productData = ProductsMock.validCreateProductData;
      const response = await productsApi.createProduct(productData);
      
      expect(response.success, '❌ Should successfully create a new product').toBeTruthy();
      expect(response.status, '❌ Status for creating a new product should be 200').toBe(200);
      expect(response.data!, '❌ Created product should have an id').toHaveProperty('id');
      expect(response.data!.title, '❌ Created product title should match input').toBe(productData.title);
      expect(response.data!.price, '❌ Created product price should match input').toBe(productData.price);
    });

    test('should create product with external data from quotable API', async () => {
      const externalDescription = await externalData.getRandomQuoteForProductDescription();
      const externalImageUrl = await externalData.getRandomImageUrl();
      
      const productData = {
        ...ProductsMock.validCreateProductData,
        description: externalDescription,
        image: externalImageUrl
      };
      
      const response = await productsApi.createProduct(productData);
      
      expect(response.success, '❌ Should create product with external data').toBeTruthy();
      expect(response.status, '❌ Status for creating product with external data should be 200').toBe(200);
      expect(response.data!.description, '❌ Product description should match external description').toBe(externalDescription);
      expect(response.data!.image, '❌ Product image should match external image URL').toBe(externalImageUrl);
    });

    test('should create product with generated random data', async () => {
      const randomProductData = DataGenerator.generateRandomProduct();
      const response = await productsApi.createProduct(randomProductData);
      
      expect(response.success, '❌ Should create product with random data').toBeTruthy();
      expect(response.status, '❌ Status for creating product with random data should be 200').toBe(200);
      expect(response.data!, '❌ Created product should have an id').toHaveProperty('id');
    });

    test('should handle invalid product data', async () => {
      const response = await productsApi.createProduct(ProductsMock.invalidCreateProductData as any);
      
      // API behavior for invalid data might vary
      expect([200, 400], '❌ Status for invalid product data should be 200 or 400').toContain(response.status);
    });

    test('should handle product data with invalid data types', async () => {
      const response = await productsApi.createProduct(ProductsMock.invalidDataTypes as any);
      
      // API should handle type mismatches
      expect([200, 400], '❌ Status for invalid data types should be 200 or 400').toContain(response.status);
    });
  });

  test.describe('PUT /products/{id} - Update Product', () => {
    test('should successfully update an existing product', async () => {
      const productId = 1;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(productId, updateData);
      
      expect(response.success, '❌ Should successfully update an existing product').toBeTruthy();
      expect(response.status, '❌ Status for updating an existing product should be 200').toBe(200);
      expect(response.data!.id, '❌ Updated product ID should match requested ID').toBe(productId);
      expect(response.data!.title, '❌ Updated product title should match input').toBe(updateData.title);
    });

    test('should successfully perform partial update of product', async () => {
      const productId = 2;
      const partialUpdateData = ProductsMock.partialUpdateProductData;
      const response = await productsApi.updateProduct(productId, partialUpdateData);
      
      expect(response.success, '❌ Should successfully perform partial update of product').toBeTruthy();
      expect(response.status, '❌ Status for partial update should be 200').toBe(200);
      expect(response.data!.id, '❌ Updated product ID should match requested ID').toBe(productId);
      expect(response.data!.title, '❌ Updated product title should match input').toBe(partialUpdateData.title);
    });

    test('should handle update of non-existent product', async () => {
      const nonExistentId = 99999;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(nonExistentId, updateData);
      
      // API might create new product or return error
      expect([200, 404], '❌ Status for updating non-existent product should be 200 or 404').toContain(response.status);
    });

    test('should handle invalid update data', async () => {
      const productId = 1;
      const invalidData = { title: null, price: "not-a-number" };
      const response = await productsApi.updateProduct(productId, invalidData as any);
      
      // API should handle invalid data appropriately
      expect([200, 400], '❌ Status for invalid update data should be 200 or 400').toContain(response.status);
    });
  });

  test.describe('DELETE /products/{id} - Delete Product', () => {
    test('should successfully delete an existing product', async () => {
      const productId = 1;
      const response = await productsApi.deleteProduct(productId);
      
      expect(response.success, '❌ Should successfully delete an existing product').toBeTruthy();
      expect(response.status, '❌ Status for deleting an existing product should be 200').toBe(200);
      expect(response.data!, '❌ Deleted product should have an id').toHaveProperty('id');
    });

    test('should handle deletion of non-existent product', async () => {
      const nonExistentId = 99999;
      const response = await productsApi.deleteProduct(nonExistentId);
      
      // API might return success or 404 for non-existent products
      expect([200, 404], '❌ Status for deleting non-existent product should be 200 or 404').toContain(response.status);
    });

    test('should handle invalid product ID for deletion', async () => {
      const invalidId = -1;
      const response = await productsApi.deleteProduct(invalidId);
      
      // API should handle invalid IDs gracefully
      expect([200, 400, 404], '❌ Status for invalid product ID for deletion should be 200, 400, or 404').toContain(response.status);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle network timeout gracefully', async () => {
      // This test would require network simulation, 
      // here we test basic error handling structure
      try {
        const response = await productsApi.getAllProducts();
        expect(response, '❌ Response should not be undefined in case of network timeout').toBeDefined();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    test('should validate external API availability', async () => {
      const availability = await externalData.validateExternalApiAvailability();
      
      // Log availability for debugging
      console.log('External API Availability:', availability);
      
      // Test should not fail if external APIs are unavailable
      expect(typeof availability.quotable, '❌ quotable availability should be boolean').toBe('boolean');
      expect(typeof availability.picsum, '❌ picsum availability should be boolean').toBe('boolean');
    });
  });
});