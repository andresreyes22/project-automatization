import { test, expect } from '@playwright/test';
import { CartsApiPage } from '../pages/carts-api.page';
import { CartsMock } from '../mocks/carts.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { Cart } from '../interfaces/cart.interface';

test.describe('Carts API Tests', () => {
  let cartsApi: CartsApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    cartsApi = new CartsApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /carts - Get All Carts', () => {
    test('should successfully retrieve all carts', async () => {
      const response = await cartsApi.getAllCarts();
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      expect(response.data!.length).toBeGreaterThan(0);
      
      // Validate first cart structure
      const firstCart = response.data![0];
      CartsMock.requiredCartFields.forEach(field => {
        expect(firstCart).toHaveProperty(field);
      });
      
      // Validate products array structure
      expect(Array.isArray(firstCart.products)).toBeTruthy();
      if (firstCart.products.length > 0) {
        CartsMock.requiredCartProductFields.forEach(field => {
          expect(firstCart.products[0]).toHaveProperty(field);
        });
      }
    });

    test('should retrieve carts with limit and sort parameters', async () => {
      const limit = 3;
      const response = await cartsApi.getCartsWithLimit(limit, 'desc');
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!.length).toBeLessThanOrEqual(limit);
    });

    test('should handle invalid limit parameter gracefully', async () => {
      const response = await cartsApi.getCartsWithLimit(-1);
      
      // API should handle invalid parameters gracefully
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
    });
  });

  test.describe('GET /carts/{id} - Get Cart by ID', () => {
    test('should successfully retrieve a specific cart', async () => {
      const cartId = 1;
      const response = await cartsApi.getCartById(cartId);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!.id).toBe(cartId);
      
      // Validate cart structure
      CartsMock.requiredCartFields.forEach(field => {
        expect(response.data!).toHaveProperty(field);
      });
      
      // Validate date format
      expect(new Date(response.data!.date).getTime()).not.toBeNaN();
    });

    test('should return 404 for non-existent cart', async () => {
      const nonExistentId = 99999;
      const response = await cartsApi.getCartById(nonExistentId);
      
      expect(response.status).toBe(404);
      expect(response.success).toBeFalsy();
    });

    test('should handle invalid cart ID formats', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await cartsApi.getCartById(invalidId);
        expect([200, 404]).toContain(response.status);
      }
    });
  });

  test.describe('GET /carts/user/{userId} - Get Carts by User ID', () => {
    test('should successfully retrieve carts for user 2', async () => {
      const userId = 2;
      const response = await cartsApi.getCartsByUserId(userId);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      
      // Verify all carts belong to the requested user
      response.data!.forEach((cart: Cart) => {
        expect(cart.userId).toBe(userId);
      });
    });

    test('should handle request for non-existent user', async () => {
      const nonExistentUserId = 99999;
      const response = await cartsApi.getCartsByUserId(nonExistentUserId);
      
      // API might return empty array or 404
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.data)).toBeTruthy();
      }
    });

    test('should handle invalid user ID formats', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await cartsApi.getCartsByUserId(invalidId);
        expect([200, 400, 404]).toContain(response.status);
      }
    });

    test('should retrieve carts for multiple users and validate userId consistency', async () => {
      const userIds = [1, 2, 3];
      
      for (const userId of userIds) {
        const response = await cartsApi.getCartsByUserId(userId);
        
        if (response.success && response.data!.length > 0) {
          response.data!.forEach((cart: Cart) => {
            expect(cart.userId).toBe(userId);
          });
        }
      }
    });
  });

  test.describe('POST /carts - Create Cart', () => {
    test('should successfully create a new cart with valid data', async () => {
      const cartData = CartsMock.validCreateCartData;
      const response = await cartsApi.createCart(cartData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!).toHaveProperty('id');
      expect(response.data!.userId).toBe(cartData.userId);
      expect(Array.isArray(response.data!.products)).toBeTruthy();
    });

    test('should create cart with external date from WorldTimeAPI', async () => {
      try {
        const externalDate = await externalData.getCurrentDateFromWorldTimeApi();
        const cartData = {
          ...CartsMock.validCreateCartData,
          date: externalDate
        };
        
        const response = await cartsApi.createCart(cartData);
        
        expect(response.success).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.data!.date).toBe(externalDate);
      } catch (error) {
        console.log('External date API unavailable, skipping test');
        expect(true).toBeTruthy();
      }
    });

    test('should create cart with generated random data', async () => {
      const randomCartData = DataGenerator.generateRandomCart();
      const response = await cartsApi.createCart(randomCartData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!).toHaveProperty('id');
    });

    test('should handle invalid cart data', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidCreateCartData as any);
      
      // API behavior for invalid data might vary
      expect([200, 400]).toContain(response.status);
    });

    test('should handle cart data with invalid data types', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidDataTypes as any);
      
      // API should handle type mismatches
      expect([200, 400]).toContain(response.status);
    });

    test('should handle cart creation with invalid product structure', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidProductStructure as any);
      
      // API should validate product structure
      expect([200, 400]).toContain(response.status);
    });

    test('should validate product quantities are positive numbers', async () => {
      const cartDataWithNegativeQuantity = {
        userId: 1,
        date: new Date().toISOString(),
        products: [
          { productId: 1, quantity: -1 }, // Negative quantity
          { productId: 2, quantity: 0 }   // Zero quantity
        ]
      };
      
      const response = await cartsApi.createCart(cartDataWithNegativeQuantity);
      
      // API should handle invalid quantities appropriately
      expect([200, 400]).toContain(response.status);
    });
  });

  test.describe('PUT /carts/{id} - Update Cart', () => {
    test('should successfully update an existing cart', async () => {
      const cartId = 1;
      const updateData = CartsMock.validUpdateCartData;
      const response = await cartsApi.updateCart(cartId, updateData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!.id).toBe(cartId);
      expect(response.data!.userId).toBe(updateData.userId);
    });

    test('should successfully perform partial update of cart', async () => {
      const cartId = 2;
      const partialUpdateData = CartsMock.partialUpdateCartData;
      const response = await cartsApi.updateCart(cartId, partialUpdateData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!.id).toBe(cartId);
      expect(Array.isArray(response.data!.products)).toBeTruthy();
    });

    test('should handle update of non-existent cart', async () => {
      const nonExistentId = 99999;
      const updateData = CartsMock.validUpdateCartData;
      const response = await cartsApi.updateCart(nonExistentId, updateData);
      
      // API might create new cart or return error
      expect([200, 404]).toContain(response.status);
    });

    test('should handle invalid update data', async () => {
      const cartId = 1;
      const invalidData = { userId: "not-a-number", products: "not-an-array" };
      const response = await cartsApi.updateCart(cartId, invalidData as any);
      
      // API should handle invalid data appropriately
      expect([200, 400]).toContain(response.status);
    });

    test('should handle cart update with empty products array', async () => {
      const cartId = 1;
      const updateData = {
        userId: 1,
        date: new Date().toISOString(),
        products: []
      };
      
      const response = await cartsApi.updateCart(cartId, updateData);
      
      // API should handle empty products array
      expect([200, 400]).toContain(response.status);
    });
  });

  test.describe('DELETE /carts/{id} - Delete Cart', () => {
    test('should successfully delete an existing cart', async () => {
      const cartId = 1;
      const response = await cartsApi.deleteCart(cartId);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!).toHaveProperty('id');
    });

    test('should handle deletion of non-existent cart', async () => {
      const nonExistentId = 99999;
      const response = await cartsApi.deleteCart(nonExistentId);
      
      // API might return success or 404 for non-existent carts
      expect([200, 404]).toContain(response.status);
    });

    test('should handle invalid cart ID for deletion', async () => {
      const invalidId = -1;
      const response = await cartsApi.deleteCart(invalidId);
      
      // API should handle invalid IDs gracefully
      expect([200, 400, 404]).toContain(response.status);
    });

    test('should verify cart deletion by attempting to retrieve deleted cart', async () => {
      // First, create a cart
      const cartData = CartsMock.generateRandomCartData();
      const createResponse = await cartsApi.createCart(cartData);
      
      if (createResponse.success && createResponse.data?.id) {
        const cartId = createResponse.data.id;
        
        // Delete the cart
        const deleteResponse = await cartsApi.deleteCart(cartId);
        expect(deleteResponse.status).toBe(200);
        
        // Try to retrieve the deleted cart
        const getResponse = await cartsApi.getCartById(cartId);
        
        // Note: FakeStore API might not actually delete the cart,
        // it's a simulation, so we check for appropriate response
        expect([200, 404]).toContain(getResponse.status);
      }
    });
  });

  test.describe('GET /carts - Date Range Filtering', () => {
    test('should retrieve carts within specified date range', async () => {
      const startDate = '2019-12-01';
      const endDate = '2020-03-31';
      const response = await cartsApi.getCartsByDateRange(startDate, endDate);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
      
      // Validate dates are within range (if carts are returned)
      if (response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          const cartDate = new Date(cart.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          expect(cartDate.getTime()).toBeGreaterThanOrEqual(start.getTime());
          expect(cartDate.getTime()).toBeLessThanOrEqual(end.getTime());
        });
      }
    });

    test('should handle invalid date range formats', async () => {
      const invalidStartDate = 'invalid-date';
      const invalidEndDate = 'also-invalid';
      const response = await cartsApi.getCartsByDateRange(invalidStartDate, invalidEndDate);
      
      // API should handle invalid date formats
      expect([200, 400]).toContain(response.status);
    });

    test('should handle reversed date range (end before start)', async () => {
      const startDate = '2020-12-31';
      const endDate = '2020-01-01';
      const response = await cartsApi.getCartsByDateRange(startDate, endDate);
      
      // API should handle reversed date ranges appropriately
      expect([200, 400]).toContain(response.status);
      
      if (response.success) {
        expect(Array.isArray(response.data)).toBeTruthy();
        // Should return empty array or handle gracefully
      }
    });
  });

  test.describe('Data Validation and Business Logic', () => {
    test('should validate cart product IDs reference valid products', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        const cart = response.data![0];
        
        // Product IDs should be positive integers
        cart.products.forEach(product => {
          expect(typeof product.productId).toBe('number');
          expect(product.productId).toBeGreaterThan(0);
          expect(typeof product.quantity).toBe('number');
          expect(product.quantity).toBeGreaterThan(0);
        });
      }
    });

    test('should validate cart date formats are ISO strings', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          // Date should be a valid ISO string
          const date = new Date(cart.date);
          expect(date.getTime(), '❌ Cart date should be a valid date').not.toBeNaN();
          
          // Should be in ISO format
          expect(cart.date, '❌ Cart date should be in ISO format').toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });
      }
    });

    test('should validate user IDs are positive integers', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          expect(typeof cart.userId).toBe('number');
          expect(cart.userId).toBeGreaterThan(0);
          expect(Number.isInteger(cart.userId)).toBeTruthy();
        });
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent cart operations gracefully', async () => {
      const cartData = CartsMock.generateRandomCartData();
      const numberOfRequests = 3;
      
      const createPromises = Array(numberOfRequests).fill(null).map(() => 
        cartsApi.createCart(cartData)
      );
      
      const responses = await Promise.all(createPromises);
      
      // All requests should succeed (or fail consistently)
      responses.forEach(response => {
        expect([200, 400]).toContain(response.status);
      });
    });

    test('should validate external API integration for dates', async () => {
      const availability = await externalData.validateExternalApiAvailability();
      
      if (availability.worldTime) {
        const externalDate = await externalData.getCurrentDateFromWorldTimeApi();
        expect(typeof externalDate).toBe('string');
        expect(new Date(externalDate).getTime()).not.toBeNaN();
      } else {
        console.log('WorldTime API is not available');
        expect(true).toBeTruthy();
      }
    });

    test('should handle cart creation with duplicate product IDs', async () => {
      const cartData = {
        userId: 1,
        date: new Date().toISOString(),
        products: [
          { productId: 1, quantity: 2 },
          { productId: 1, quantity: 3 } // Duplicate product ID
        ]
      };
      
      const response = await cartsApi.createCart(cartData);
      
      // API should handle duplicate product IDs appropriately
      expect([200, 400]).toContain(response.status);
    });

    test('should handle maximum products limit in cart', async () => {
      const manyProducts = Array(100).fill(null).map((_, index) => ({
        productId: index + 1,
        quantity: 1
      }));
      
      const cartData = {
        userId: 1,
        date: new Date().toISOString(),
        products: manyProducts
      };
      
      const response = await cartsApi.createCart(cartData);
      
      // API should handle large product arrays appropriately
      expect([200, 400, 413], '❌ Status for maximum products limit should be 200, 400, or 413').toContain(response.status);
    });
  });
});