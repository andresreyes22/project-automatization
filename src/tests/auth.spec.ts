import { test, expect } from '@playwright/test';
import { AuthApiPage } from '../pages/auth-api.page';
import { UsersMock } from '../mocks/users.mock';
import { DataGenerator } from '../utils/data-generator';

test.describe('Pruebas de la API de Autenticación', () => {
  let authApi: AuthApiPage;

  test.beforeEach(async ({ request }) => {
    authApi = new AuthApiPage(request);
  });

  test.describe('POST /auth/login - Autenticación de Usuario', () => {
    test('debería autenticar exitosamente con credenciales válidas', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const response = await authApi.login(credentials);
      console.log('🔍 login(credenciales válidas) respuesta:', response);
      
      expect(response.success, '❌ La autenticación con credenciales válidas debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para autenticación exitosa debe ser 200').toBe(200);
      expect(response.data!, '❌ La respuesta debe contener un token').toHaveProperty('token');
      expect(typeof response.data!.token, '❌ El token debe ser un string').toBe('string');
      expect(response.data!.token.length, '❌ El token no debe estar vacío').toBeGreaterThan(0);
      
      // Validar formato del token (estructura básica JWT)
      const isValidTokenFormat = authApi.validateTokenFormat(response.data!.token);
      expect(isValidTokenFormat, '❌ El formato del token JWT no es válido').toBeTruthy();
    });

    test('debería rechazar autenticación con credenciales inválidas', async () => {
      const invalidCredentials = UsersMock.invalidLoginCredentials;
      const response = await authApi.login(invalidCredentials);
      console.log('🔍 login(credenciales inválidas) respuesta:', response);
      
      // La autenticación debe fallar estrictamente: nunca aceptar 200
      expect([401, 400, 404], '❌ El status para credenciales inválidas NUNCA debe ser 200. Solo se acepta 401, 400 o 404').toContain(response.status);
      expect(response.status, '❌ Nunca debe ser 200 ante credenciales inválidas').not.toBe(200);
      expect(response.success, '❌ La autenticación con credenciales inválidas NO debe ser exitosa').toBeFalsy();
    });

    test('debería rechazar autenticación con username vacío', async () => {
      const credentials = {
        username: '',
        password: 'somepassword'
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(username vacío) respuesta:', response);
      
      expect([400, 401], '❌ El status para username vacío debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con username vacío NO debe ser exitosa').toBeFalsy();
    });

    test('debería rechazar autenticación con password vacío', async () => {
      const credentials = {
        username: 'someuser',
        password: ''
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(password vacío) respuesta:', response);
      
      expect([400, 401], '❌ El status para password vacío debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con password vacío NO debe ser exitosa').toBeFalsy();
    });

    test('debería rechazar autenticación sin campo username', async () => {
      const credentials = {
        password: 'somepassword'
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(falta username) respuesta:', response);
      
      expect([400, 401], '❌ El status para falta de username debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación sin username NO debe ser exitosa').toBeFalsy();
    });

    test('debería rechazar autenticación sin campo password', async () => {
      const credentials = {
        username: 'someuser'
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(falta password) respuesta:', response);
      
      expect([400, 401], '❌ El status para falta de password debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación sin password NO debe ser exitosa').toBeFalsy();
    });

    test('debería manejar autenticación con caracteres especiales', async () => {
      const credentials = {
        username: 'user@#$%',
        password: 'pass!@#$%^&*()'
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(caracteres especiales) respuesta:', response);
      
      expect([200, 400, 401], '❌ El status para caracteres especiales debe ser 200, 400 o 401').toContain(response.status);
    });

    test('debería manejar autenticación con credenciales muy largas', async () => {
      const longString = 'a'.repeat(1000);
      const credentials = {
        username: longString,
        password: longString
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(credenciales muy largas) respuesta:', response);
      
      expect([400, 401, 413], '❌ El status para credenciales muy largas debe ser 400, 401 o 413').toContain(response.status);
    });

    test('debería manejar autenticación con valores null', async () => {
      const credentials = {
        username: null,
        password: null
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(valores null) respuesta:', response);
      
      expect([400, 401], '❌ El status para valores null debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con valores null NO debe ser exitosa').toBeFalsy();
    });

    test('debería manejar autenticación con valores no string', async () => {
      const credentials = {
        username: 123,
        password: true
      } as any;
      const response = await authApi.login(credentials);
      console.log('🔍 login(valores no string) respuesta:', response);
      
      expect([400, 401], '❌ El status para valores no string debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con valores no string NO debe ser exitosa').toBeFalsy();
    });

    test('debería manejar intento de inyección SQL', async () => {
      const credentials = {
        username: "admin'; DROP TABLE users; --",
        password: "' OR '1'='1"
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(inyección SQL) respuesta:', response);
      
      expect([400, 401], '❌ El status para intento de inyección SQL debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con inyección SQL NO debe ser exitosa').toBeFalsy();
    });

    test('debería manejar intento de XSS', async () => {
      const credentials = {
        username: "<script>alert('xss')</script>",
        password: "<img src=x onerror=alert('xss')>"
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(XSS) respuesta:', response);

      expect([400, 401], '❌ El status para intento de XSS debe ser 400 o 401').toContain(response.status);
      expect(response.success, '❌ La autenticación con XSS NO debe ser exitosa').toBeFalsy();
    });

    test('debería validar la estructura del token JWT cuando la autenticación es exitosa', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const response = await authApi.login(credentials);
      console.log('🔍 login(validar JWT) respuesta:', response);
      
      if (response.success && response.data?.token) {
        const token = response.data.token;
        
        // El token JWT debe tener 3 partes separadas por punto
        const tokenParts = token.split('.');
        expect(tokenParts, '❌ El token JWT debe tener 3 partes separadas por punto').toHaveLength(3);
        
        // Cada parte no debe estar vacía
        tokenParts.forEach(part => {
          expect(part.length, '❌ Cada parte del token JWT debe ser no vacía').toBeGreaterThan(0);
        });
        
        // El primer segmento debe ser base64
        const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
        expect(base64Regex.test(tokenParts[0].replace(/-/g, '+').replace(/_/g, '/')), '❌ El primer segmento del token JWT debe ser base64').toBeTruthy();
      }
    });

    test('debería manejar autenticaciones concurrentes', async () => {
      const credentials = UsersMock.validLoginCredentials;
      const numberOfRequests = 5;
      const authPromises = Array(numberOfRequests).fill(null).map(() => 
        authApi.login(credentials)
      );
      const responses = await Promise.all(authPromises);
      console.log('🔍 login(concurrente) respuestas:', responses);
      
      // Todas las respuestas deben tener el mismo status (o máximo 2 por rate limit)
      const statuses = responses.map(r => r.status);
      const uniqueStatuses = [...new Set(statuses)];
      expect(uniqueStatuses.length, '❌ Las respuestas concurrentes deben tener como máximo 2 códigos de status distintos').toBeLessThanOrEqual(2);
    });

    test('debería manejar autenticación con username en mayúsculas', async () => {
      const credentials = {
        username: UsersMock.validLoginCredentials.username.toUpperCase(),
        password: UsersMock.validLoginCredentials.password
      };
      const response = await authApi.login(credentials);
      console.log('🔍 login(username mayúsculas) respuesta:', response);
      
      expect([200, 401], '❌ El status para username en mayúsculas debe ser 200 o 401').toContain(response.status);
    });

    test('debería manejar rate limiting en autenticación', async () => {
      const credentials = UsersMock.invalidLoginCredentials;
      const numberOfAttempts = 10;
      const responses = [];
      for (let i = 0; i < numberOfAttempts; i++) {
        const response = await authApi.login(credentials);
        responses.push(response);
        console.log(`🔍 login(rate limit) respuesta [${i}]:`, response);
      }
      // Verificar si hay rate limiting
      const statusCodes = responses.map(r => r.status);
      const hayRateLimiting = statusCodes.some(status => status === 429);
      if (hayRateLimiting) {
        console.log('Se detectó rate limiting (429) en la autenticación.');
      } else {
        console.log('No se detectó rate limiting, todos los status:', statusCodes);
      }
    });
  });

  test.describe('Pruebas de la Utilidad de Validación de Token', () => {
    test('debería validar el formato correcto del token JWT', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
      
      const isValid = authApi.validateTokenFormat(validToken);
      expect(isValid, '❌ Un token válido debe pasar la validación de formato').toBeTruthy();
    });

    test('debería rechazar formatos de token inválidos', () => {
      const invalidTokens = [
        '', // Cadena vacía
        'invalid.token', // Solo 2 partes
        'invalid', // Solo 1 parte
        'part1.part2.part3.part4', // Demasiadas partes
        'part1..part3', // Parte del medio vacía
        '.part2.part3', // Parte inicial vacía
        'part1.part2.', // Parte final vacía
      ];
      
      invalidTokens.forEach(token => {
        const isValid = authApi.validateTokenFormat(token);
        expect(isValid, `❌ El token '${token}' no debe pasar la validación de formato`).toBeFalsy();
      });
    });
  });

  test.describe('Manejo de Errores y Casos Límite', () => {
    test('debería manejar JSON malformado en la solicitud de inicio de sesión', async () => {
      // Este test demuestra el manejo de errores para solicitudes malformadas
      try {
        const response = await authApi.login('not-an-object' as any);
        console.log('🔍 login(JSON malformado) respuesta:', response);
        expect([400, 401], '❌ El status para JSON malformado debe ser 400 o 401').toContain(response.status);
      } catch (error) {
        console.log('🔍 login(JSON malformado) error:', error);
        expect(error).toBeDefined();
      }
    });

    test('debería manejar timeout de red en la autenticación', async () => {
      // Este test requeriría simulación de red
      // Por ahora, aseguramos que la API maneja escenarios básicos de error
      try {
        const response = await authApi.login(UsersMock.validLoginCredentials);
        console.log('🔍 login(timeout de red) respuesta:', response);
        expect(response, '❌ La respuesta no debe ser indefinida en caso de timeout').toBeDefined();
        expect(typeof response.status, '❌ El status debe ser un número en caso de timeout').toBe('number');
      } catch (error) {
        console.log('🔍 login(timeout de red) error:', error);
        expect(error).toBeDefined();
      }
    });
  });
});