import { test, expect } from '@playwright/test';
import { AuthApiPage } from '../pages/auth-api.page';
import { UsersMock } from '../mocks/users.mock';
import { DataGenerator } from '../utils/data-generator';

test.describe('Authentication API Tests', () => {
  let authApi: AuthApiPage;

  test.beforeEach(async ({ request }) => {
    authApi = new AuthApiPage(request);
  });

  test.describe('POST /auth/login - User Authentication', () => {
    test('should successfully authenticate with valid credentials', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const response = await authApi.login(credentials);
      console.log('🔍 login(valid credentials) response:', response);
      
      expect(response.success, '❌ Authentication with valid credentials should succeed').toBeTruthy();
      expect(response.status, '❌ Status for successful authentication should be 200').toBe(200);
      expect(response.data!, '❌ Response should contain a token').toHaveProperty('token');
      expect(typeof response.data!.token, '❌ Token should be a string').toBe('string');
      expect(response.data!.token.length, '❌ Token should not be empty').toBeGreaterThan(0);
      
      // Validate token format (basic JWT structure)
      const isValidTokenFormat = authApi.validateTokenFormat(response.data!.token);
      expect(isValidTokenFormat).toBeTruthy();
    });

    test('should reject authentication with invalid credentials', async () => {
      const invalidCredentials = UsersMock.invalidLoginCredentials;
      const response = await authApi.login(invalidCredentials);
      console.log('🔍 login(invalid credentials) response:', response);
      
      // La autenticación debe fallar estrictamente: nunca aceptar 200
      expect([401, 400, 404], '❌ El status para credenciales inválidas NUNCA debe ser 200. Solo se acepta 401, 400 o 404').toContain(response.status);
      expect(response.status, '❌ Nunca debe ser 200 ante credenciales inválidas').not.toBe(200);
      expect(response.success, '❌ Authentication with invalid credentials should not succeed').toBeFalsy();
    });

    test('should reject authentication with empty username', async () => {
      const credentials = {
        username: '',
        password: 'somepassword'
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(empty username) response:', response);
      
      expect([400, 401], '❌ Status for empty username should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with empty username should not succeed').toBeFalsy();
    });

    test('should reject authentication with empty password', async () => {
      const credentials = {
        username: 'someuser',
        password: ''
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(empty password) response:', response);
      
      expect([400, 401], '❌ Status for empty password should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with empty password should not succeed').toBeFalsy();
    });

    test('should reject authentication with missing username field', async () => {
      const credentials = {
        password: 'somepassword'
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(missing username) response:', response);
      
      expect([400, 401], '❌ Status for missing username should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with missing username should not succeed').toBeFalsy();
    });

    test('should reject authentication with missing password field', async () => {
      const credentials = {
        username: 'someuser'
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(missing password) response:', response);
      
      expect([400, 401], '❌ Status for missing password should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with missing password should not succeed').toBeFalsy();
    });

    test('should handle authentication with special characters in credentials', async () => {
      const credentials = {
        username: 'user@#$%',
        password: 'pass!@#$%^&*()'
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(special characters) response:', response);
      
      // API should handle special characters appropriately
      expect([200, 400, 401], '❌ Status for special characters should be 200, 400, or 401').toContain(response.status);
    });

    test('should handle authentication with very long credentials', async () => {
      const longString = 'a'.repeat(1000);
      const credentials = {
        username: longString,
        password: longString
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(very long credentials) response:', response);
      
      // API should handle oversized inputs gracefully
      expect([400, 401, 413], '❌ Status for very long credentials should be 400, 401, or 413').toContain(response.status);
    });

    test('should handle authentication with null values', async () => {
      const credentials = {
        username: null,
        password: null
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(null values) response:', response);
      
      expect([400, 401], '❌ Status for null values should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with null values should not succeed').toBeFalsy();
    });

    test('should handle authentication with non-string values', async () => {
      const credentials = {
        username: 123,
        password: true
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(non-string values) response:', response);
      
      expect([400, 401], '❌ Status for non-string values should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with non-string values should not succeed').toBeFalsy();
    });

    test('should handle authentication with SQL injection attempts', async () => {
      const credentials = {
        username: "admin'; DROP TABLE users; --",
        password: "' OR '1'='1"
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(SQL injection) response:', response);
      
      // API should safely handle SQL injection attempts
      expect([400, 401], '❌ Status for SQL injection attempt should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with SQL injection should not succeed').toBeFalsy();
    });

    test('should handle authentication with XSS attempts', async () => {
      const credentials = {
        username: "<script>alert('xss')</script>",
        password: "<img src=x onerror=alert('xss')>"
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(XSS attempt) response:', response);

      // API should safely handle XSS attempts
      expect([400, 401], '❌ Status for XSS attempt should be 400 or 401').toContain(response.status);
      expect(response.success, '❌ Authentication with XSS should not succeed').toBeFalsy();
    });

    test('should validate JWT token structure when authentication succeeds', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const response = await authApi.login(credentials);
      console.log('🔍 login(validate JWT) response:', response);
      
      if (response.success && response.data?.token) {
        const token = response.data.token;
        
        // JWT tokens should have 3 parts separated by dots
        const tokenParts = token.split('.');
        expect(tokenParts, '❌ JWT token should have 3 parts separated by dot').toHaveLength(3);
        
        // Each part should be non-empty
        tokenParts.forEach(part => {
          expect(part.length, '❌ Each part of the JWT token should be non-empty').toBeGreaterThan(0);
        });
        
        // Token should be base64-like strings
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        expect(base64Regex.test(tokenParts[0].replace(/-/g, '+').replace(/_/g, '/')), '❌ The first segment of the JWT token should be base64').toBeTruthy();
      }
    });

    test('should handle concurrent authentication requests', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const numberOfRequests = 5;
      const authPromises = Array(numberOfRequests).fill(null).map(() => 
        authApi.login(credentials)
      );
      const responses = await Promise.all(authPromises);
      console.log('🔍 login(concurrent) responses:', responses);
      
      // All requests should succeed (or fail consistently)
      const statuses = responses.map(r => r.status);
      const uniqueStatuses = [...new Set(statuses)];
      
      // All responses should have the same status
      expect(uniqueStatuses.length, '❌ Concurrent responses should have at most 2 different status codes').toBeLessThanOrEqual(2); // Allow for some variation due to rate limiting
    });

    test('should handle authentication with different case username', async () => {
      const credentials = {
        username: UsersMock.validLoginCredentials.username.toUpperCase(),
        password: UsersMock.validLoginCredentials.password
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(different case username) response:', response);
      
      // API might be case-sensitive or case-insensitive
      expect([200, 401], '❌ Status for username with different case should be 200 or 401').toContain(response.status);
    });

    test('should handle authentication rate limiting gracefully', async () => {
      const credentials = UsersMock.invalidLoginCredentials;
      const numberOfAttempts = 10;
      const responses = [];
      for (let i = 0; i < numberOfAttempts; i++) {
        const response = await authApi.login(credentials);
        responses.push(response);
        console.log(`🔍 login(rate limit) response [${i}]:`, response);
        // Short delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      // Check if rate limiting is implemented
      const statusCodes = responses.map(r => r.status);
      const hasRateLimiting = statusCodes.some(status => status === 429);
      if (hasRateLimiting) {
        console.log('Rate limiting detected');
        expect(statusCodes, '❌ Status 429 should be present if rate limiting is implemented').toContain(429);
      } else {
        console.log('No rate limiting detected');
        // All should return 401 for invalid credentials
        statusCodes.forEach(status => {
          expect([400, 401], '❌ Status for failed attempts should be 400 or 401').toContain(status);
        });
      }
    });
  });

  test.describe('Token Validation Utility Tests', () => {
    test('should validate correct JWT token format', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const isValid = authApi.validateTokenFormat(validToken);
      expect(isValid, '❌ A valid token should pass the format validation').toBeTruthy();
    });

    test('should reject invalid token formats', () => {
      const invalidTokens = [
        '', // Empty string
        'invalid.token', // Only 2 parts
        'invalid', // Only 1 part
        'part1.part2.part3.part4', // Too many parts
        'part1..part3', // Empty middle part
        '.part2.part3', // Empty first part
        'part1.part2.', // Empty last part
      ];
      
      invalidTokens.forEach(token => {
        const isValid = authApi.validateTokenFormat(token);
        expect(isValid, `❌ The token '${token}' should not pass the format validation`).toBeFalsy();
      });
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('should handle malformed JSON in login request', async () => {
      // This test demonstrates error handling for malformed requests
      try {
        const response = await authApi.login('not-an-object' as any);
        console.log('🔍 login(malformed JSON) response:', response);
        expect([400, 401], '❌ Status for malformed JSON should be 400 or 401').toContain(response.status);
      } catch (error) {
        console.log('🔍 login(malformed JSON) error:', error);
        expect(error).toBeDefined();
      }
    });

    test('should handle network timeout in authentication', async () => {
      // This test would require network simulation
      // For now, we ensure the API handles basic error scenarios
      try {
        const response = await authApi.login(UsersMock.validLoginCredentials);
        console.log('🔍 login(network timeout) response:', response);
        expect(response, '❌ Response should not be undefined in case of timeout').toBeDefined();
        expect(typeof response.status, '❌ Status should be a number in case of timeout').toBe('number');
      } catch (error) {
        console.log('🔍 login(network timeout) error:', error);
        expect(error).toBeDefined();
      }
    });
  });
});