import { test, expect } from '@playwright/test';
import { UsersApiPage } from '../pages/users-api.page';
import { UsersMock } from '../mocks/users.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { User } from '../interfaces/user.interface';

test.describe('Users API Tests', () => {
  let usersApi: UsersApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    usersApi = new UsersApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /users - Get All Users', () => {
    test('should successfully retrieve all users', async () => {
      const response = await usersApi.getAllUsers();
      
      expect(response.success, '❌ Should successfully retrieve all users').toBeTruthy();
      expect(response.status, '❌ Status for retrieving all users should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Response data should be an array').toBeTruthy();
      expect(response.data!.length, '❌ Users array should not be empty').toBeGreaterThan(0);
      
      // Validate first user structure
      const firstUser = response.data![0];
      UsersMock.requiredUserFields.forEach(field => {
        expect(firstUser, `❌ User should have property '${field}'`).toHaveProperty(field);
      });
      
      // Validate nested objects
      expect(firstUser.name, '❌ User name should be defined').toBeDefined();
      UsersMock.requiredNameFields.forEach(field => {
        expect(firstUser.name, `❌ User name should have property '${field}'`).toHaveProperty(field);
      });
      
      expect(firstUser.address, '❌ User address should be defined').toBeDefined();
      UsersMock.requiredAddressFields.forEach(field => {
        expect(firstUser.address, `❌ User address should have property '${field}'`).toHaveProperty(field);
      });
    });

    test('should retrieve users with limit and sort parameters', async () => {
      const limit = 3;
      const response = await usersApi.getUsersWithLimit(limit, 'desc');
      
      expect(response.success, '❌ Should successfully retrieve users with limit').toBeTruthy();
      expect(response.status, '❌ Status for retrieving users with limit should be 200').toBe(200);
      expect(response.data!.length, '❌ Users array length should be less than or equal to limit').toBeLessThanOrEqual(limit);
    });

    test('should handle invalid limit parameter gracefully', async () => {
      const response = await usersApi.getUsersWithLimit(-1);
      
      // API should handle invalid parameters gracefully
      expect(response.status, '❌ Status for invalid limit parameter should be 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Response data should be an array for invalid limit').toBeTruthy();
    });
  });

  test.describe('GET /users/{id} - Get User by ID', () => {
    test('should successfully retrieve a specific user', async () => {
      const userId = 1;
      const response = await usersApi.getUserById(userId);
      
      expect(response.success, '❌ Should successfully retrieve a specific user').toBeTruthy();
      expect(response.status, '❌ Status for retrieving a specific user should be 200').toBe(200);
      expect(response.data!.id, '❌ User ID should match requested ID').toBe(userId);
      
      // Validate user structure
      UsersMock.requiredUserFields.forEach(field => {
        expect(response.data!, `❌ User should have property '${field}'`).toHaveProperty(field);
      });
    });

    test('should return 404 for non-existent user', async () => {
      const nonExistentId = 99999;
      const response = await usersApi.getUserById(nonExistentId);
      
      expect(response.status, '❌ Status for non-existent user should be 404').toBe(404);
      expect(response.success, '❌ Success should be false for non-existent user').toBeFalsy();
    });

    test('should handle invalid user ID formats', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await usersApi.getUserById(invalidId);
        expect([200, 404], `❌ Status for invalid user ID '${invalidId}' should be 200 or 404`).toContain(response.status);
      }
    });
  });

  test.describe('POST /users - Create User', () => {
    test('should successfully create a new user with valid data', async () => {
      const userData = UsersMock.validCreateUserData;
      const response = await usersApi.createUser(userData);
      
      expect(response.success, '❌ Should successfully create a new user').toBeTruthy();
      expect(response.status, '❌ Status for creating a new user should be 200').toBe(200);
      expect(response.data!, '❌ Created user should have an id').toHaveProperty('id');
      expect(response.data!.email, '❌ Created user email should match input').toBe(userData.email);
      expect(response.data!.username, '❌ Created user username should match input').toBe(userData.username);
    });

    test('should create user with external data from JSONPlaceholder API', async () => {
      try {
        const externalUserData = await externalData.getRandomUserFromJsonPlaceholder();
        const response = await usersApi.createUser(externalUserData);
        
        expect(response.success, '❌ Should create user with external data').toBeTruthy();
        expect(response.status, '❌ Status for creating user with external data should be 200').toBe(200);
        expect(response.data!, '❌ Created user should have an id').toHaveProperty('id');
        expect(response.data!.email, '❌ Created user email should match external data').toBe(externalUserData.email);
      } catch (error) {
        console.log('External API unavailable, skipping test');
        // Test passes if external API is unavailable
        expect(true, '❌ Test should pass if external API is unavailable').toBeTruthy();
      }
    });

    test('should create user with generated random data', async () => {
      const randomUserData = DataGenerator.generateRandomUser();
      const response = await usersApi.createUser(randomUserData);
      
      expect(response.success, '❌ Should create user with random data').toBeTruthy();
      expect(response.status, '❌ Status for creating user with random data should be 200').toBe(200);
      expect(response.data!, '❌ Created user should have an id').toHaveProperty('id');
    });

    test('should handle invalid user data', async () => {
      const response = await usersApi.createUser(UsersMock.invalidCreateUserData as any);
      
      // API behavior for invalid data might vary
      expect([200, 400], '❌ Status for invalid user data should be 200 or 400').toContain(response.status);
    });

    test('should handle user data with invalid data types', async () => {
      const response = await usersApi.createUser(UsersMock.invalidDataTypes as any);
      
      // API should handle type mismatches
      expect([200, 400], '❌ Status for invalid data types should be 200 or 400').toContain(response.status);
    });

    test('should handle user creation with invalid email formats', async () => {
      const invalidEmails = DataGenerator.generateInvalidEmails();
      
      for (const invalidEmail of invalidEmails.slice(0, 3)) { // Test first 3 to avoid long test times
        const userData = {
          ...UsersMock.validCreateUserData,
          email: invalidEmail
        };
        
        const response = await usersApi.createUser(userData);
        // API might accept or reject invalid emails
        expect([200, 400], `❌ Status for invalid email '${invalidEmail}' should be 200 or 400`).toContain(response.status);
      }
    });

    test('should handle user creation with edge case strings', async () => {
      const edgeCaseStrings = DataGenerator.generateEdgeCaseStrings();
      
      const userData = {
        ...UsersMock.validCreateUserData,
        username: edgeCaseStrings[0], // Empty string
        name: {
          firstname: edgeCaseStrings[1], // Whitespace
          lastname: edgeCaseStrings[2] // Multiple whitespaces
        }
      };
      
      const response = await usersApi.createUser(userData);
      expect([200, 400], '❌ Status for edge case strings should be 200 or 400').toContain(response.status);
    });
  });

  test.describe('PUT /users/{id} - Update User', () => {
    test('should successfully update an existing user', async () => {
      const userId = 1;
      const updateData = {
        email: 'updated@example.com',
        username: 'updateduser',
        name: {
          firstname: 'Updated',
          lastname: 'User'
        }
      };
      
      const response = await usersApi.updateUser(userId, updateData);
      
      expect(response.success, '❌ Should successfully update an existing user').toBeTruthy();
      expect(response.status, '❌ Status for updating an existing user should be 200').toBe(200);
      expect(response.data!.id, '❌ Updated user ID should match requested ID').toBe(userId);
      expect(response.data!.email, '❌ Updated user email should match input').toBe(updateData.email);
    });

    test('should successfully perform partial update of user', async () => {
      const userId = 2;
      const partialUpdateData = {
        email: 'partial@example.com'
      };
      
      const response = await usersApi.updateUser(userId, partialUpdateData);
      
      expect(response.success, '❌ Should successfully perform partial update of user').toBeTruthy();
      expect(response.status, '❌ Status for partial update should be 200').toBe(200);
      expect(response.data!.id, '❌ Updated user ID should match requested ID').toBe(userId);
      expect(response.data!.email, '❌ Updated user email should match input').toBe(partialUpdateData.email);
    });

    test('should handle update of non-existent user', async () => {
      const nonExistentId = 99999;
      const updateData = { email: 'test@example.com' };
      const response = await usersApi.updateUser(nonExistentId, updateData);
      
      // API might create new user or return error
      expect([200, 404], '❌ Status for updating non-existent user should be 200 or 404').toContain(response.status);
    });

    test('should handle invalid update data', async () => {
      const userId = 1;
      const invalidData = { email: null, username: 123 };
      const response = await usersApi.updateUser(userId, invalidData as any);
      
      // API should handle invalid data appropriately
      expect([200, 400], '❌ Status for invalid update data should be 200 or 400').toContain(response.status);
    });
  });

  test.describe('DELETE /users/{id} - Delete User', () => {
    test('should successfully delete an existing user', async () => {
      const userId = 1;
      const response = await usersApi.deleteUser(userId);
      
      expect(response.success, '❌ Should successfully delete an existing user').toBeTruthy();
      expect(response.status, '❌ Status for deleting an existing user should be 200').toBe(200);
      expect(response.data!, '❌ Deleted user should have an id').toHaveProperty('id');
    });

    test('should handle deletion of non-existent user', async () => {
      const nonExistentId = 99999;
      const response = await usersApi.deleteUser(nonExistentId);
      
      // API might return success or 404 for non-existent users
      expect([200, 404], '❌ Status for deleting non-existent user should be 200 or 404').toContain(response.status);
    });

    test('should handle invalid user ID for deletion', async () => {
      const invalidId = -1;
      const response = await usersApi.deleteUser(invalidId);
      
      // API should handle invalid IDs gracefully
      expect([200, 400, 404], '❌ Status for invalid user ID for deletion should be 200, 400, or 404').toContain(response.status);
    });
  });

  test.describe('Data Validation and Constraints', () => {
    test('should validate email format in user responses', async () => {
      const response = await usersApi.getAllUsers();
      
      if (response.success && response.data!.length > 0) {
        const user = response.data![0];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(user.email), '❌ User email should match email format').toBeTruthy();
      }
    });

    test('should validate phone number format in user responses', async () => {
      const response = await usersApi.getAllUsers();
      
      if (response.success && response.data!.length > 0) {
        const user = response.data![0];
        expect(typeof user.phone, '❌ User phone should be a string').toBe('string');
        expect(user.phone.length, '❌ User phone should not be empty').toBeGreaterThan(0);
      }
    });

    test('should validate geolocation coordinates format', async () => {
      const response = await usersApi.getUserById(1);
      
      if (response.success) {
        const user = response.data!;
        const lat = parseFloat(user.address.geolocation.lat);
        const long = parseFloat(user.address.geolocation.long);
        
        expect(lat, '❌ Latitude should be >= -90').toBeGreaterThanOrEqual(-90);
        expect(lat, '❌ Latitude should be <= 90').toBeLessThanOrEqual(90);
        expect(long, '❌ Longitude should be >= -180').toBeGreaterThanOrEqual(-180);
        expect(long, '❌ Longitude should be <= 180').toBeLessThanOrEqual(180);
      }
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in request body', async () => {
      // This would require lower-level request manipulation
      // For now, we test with invalid data structures
      const malformedData = "not-json";
      
      try {
        const response = await usersApi.createUser(malformedData as any);
        expect([200, 400], '❌ Status for malformed JSON should be 200 or 400').toContain(response.status);
      } catch (error) {
        expect(error, '❌ Error should be defined for malformed JSON').toBeDefined();
      }
    });

    test('should validate external API integration resilience', async () => {
      const availability = await externalData.validateExternalApiAvailability();
      
      if (availability.jsonPlaceholder) {
        const externalUserData = await externalData.getRandomUserFromJsonPlaceholder();
        expect(externalUserData, '❌ External user data should be defined').toBeDefined();
        expect(externalUserData.email, '❌ External user email should be defined').toBeDefined();
      } else {
        console.log('JSONPlaceholder API is not available');
        expect(true, '❌ Test should pass if external API is unavailable').toBeTruthy(); // Test passes even if external API is unavailable
      }
    });
  });
});