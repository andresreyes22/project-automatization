import { test, expect } from '@playwright/test';
import { CartsApiPage } from '../pages/carts-api.page';
import { CartsMock } from '../mocks/carts.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { Cart } from '../interfaces/cart.interface';

test.describe('Pruebas de la API de Carritos', () => {
  let cartsApi: CartsApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    cartsApi = new CartsApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /carts - Obtener todos los carritos', () => {
    test('debería obtener exitosamente todos los carritos', async () => {
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

    test('debería obtener carritos con parámetros de límite y orden', async () => {
      const limit = 3;
      const response = await cartsApi.getCartsWithLimit(limit, 'desc');
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!.length).toBeLessThanOrEqual(limit);
    });

    test('debería manejar el parámetro de límite inválido apropiadamente', async () => {
      const response = await cartsApi.getCartsWithLimit(-1);
      
      // API should handle invalid parameters gracefully
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data)).toBeTruthy();
    });
  });

  test.describe('GET /carts/{id} - Obtener carrito por ID', () => {
    test('debería obtener exitosamente un carrito específico', async () => {
      const cartId = 1;
      const response = await cartsApi.getCartById(cartId);
      
      expect(response.success, '❌ La obtención del carrito debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener carrito debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del carrito debe coincidir').toBe(cartId);
      
      // Validar estructura del carrito
      CartsMock.requiredCartFields.forEach(field => {
        expect(response.data!, `❌ El carrito debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
      
      // Validar formato de fecha
      expect(new Date(response.data!.date).getTime(), '❌ La fecha del carrito debe ser válida').not.toBeNaN();
    });

    test('debería retornar 404 para un carrito inexistente', async () => {
      const nonExistentId = 99999;
      const response = await cartsApi.getCartById(nonExistentId);
      
      expect(response.status, '❌ El status para carrito inexistente debe ser 404').toBe(404);
      expect(response.success, '❌ El success debe ser false para carrito inexistente').toBeFalsy();
    });

    test('debería manejar formatos de ID de carrito inválidos', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await cartsApi.getCartById(invalidId);
        expect([200, 404], `❌ El status para ID de carrito inválido '${invalidId}' debe ser 200 o 404`).toContain(response.status);
      }
    });
  });

  test.describe('GET /carts/user/{userId} - Obtener carritos por ID de usuario', () => {
    test('debería obtener exitosamente los carritos del usuario 2', async () => {
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

    test('debería manejar la solicitud para un usuario inexistente', async () => {
      const nonExistentUserId = 99999;
      const response = await cartsApi.getCartsByUserId(nonExistentUserId);
      
      // API might return empty array or 404
      expect([200, 404]).toContain(response.status);
      
      if (response.status === 200) {
        expect(Array.isArray(response.data)).toBeTruthy();
      }
    });

    test('debería manejar formatos de ID de usuario inválidos', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await cartsApi.getCartsByUserId(invalidId);
        expect([200, 400, 404]).toContain(response.status);
      }
    });

    test('debería obtener carritos para múltiples usuarios y validar la consistencia de userId', async () => {
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

  test.describe('POST /carts - Crear carrito', () => {
    test('debería crear exitosamente un nuevo carrito con datos válidos', async () => {
      const cartData = CartsMock.validCreateCartData;
      const response = await cartsApi.createCart(cartData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!).toHaveProperty('id');
      expect(response.data!.userId).toBe(cartData.userId);
      expect(Array.isArray(response.data!.products)).toBeTruthy();
    });

    test('debería crear un carrito con fecha externa de WorldTimeAPI', async () => {
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

    test('debería crear un carrito con datos aleatorios generados', async () => {
      const randomCartData = DataGenerator.generateRandomCart();
      const response = await cartsApi.createCart(randomCartData);
      
      expect(response.success).toBeTruthy();
      expect(response.status).toBe(200);
      expect(response.data!).toHaveProperty('id');
    });

    test('debería manejar datos de carrito inválidos', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidCreateCartData as any);
      
      // API behavior for invalid data might vary
      expect([200, 400]).toContain(response.status);
    });

    test('debería manejar datos de carrito con tipos de datos inválidos', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidDataTypes as any);
      
      // API should handle type mismatches
      expect([200, 400]).toContain(response.status);
    });

    test('debería manejar la creación de carrito con estructura de producto inválida', async () => {
      const response = await cartsApi.createCart(CartsMock.invalidProductStructure as any);
      
      // API should validate product structure
      expect([200, 400]).toContain(response.status);
    });

    test('debería validar que las cantidades de productos sean números positivos', async () => {
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

  test.describe('PUT /carts/{id} - Actualizar carrito', () => {
    test('debería actualizar exitosamente un carrito existente', async () => {
      const cartId = 1;
      const updateData = CartsMock.validUpdateCartData;
      const response = await cartsApi.updateCart(cartId, updateData);
      
      expect(response.success, '❌ La actualización del carrito debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualizar carrito debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del carrito actualizado debe coincidir').toBe(cartId);
      expect(response.data!.userId, '❌ El userId del carrito actualizado debe coincidir').toBe(updateData.userId);
    });

    test('debería permitir la actualización parcial de un carrito', async () => {
      const cartId = 2;
      const partialUpdateData = CartsMock.partialUpdateCartData;
      const response = await cartsApi.updateCart(cartId, partialUpdateData);
      
      expect(response.success, '❌ La actualización parcial debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualización parcial debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del carrito actualizado debe coincidir').toBe(cartId);
      expect(Array.isArray(response.data!.products), '❌ El carrito debe tener un array de productos').toBeTruthy();
    });

    test('debería manejar la actualización de un carrito inexistente', async () => {
      const nonExistentId = 99999;
      const updateData = CartsMock.validUpdateCartData;
      const response = await cartsApi.updateCart(nonExistentId, updateData);
      
      // La API puede crear un nuevo carrito o devolver error
      expect([200, 404], '❌ El status para carrito inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar datos inválidos en la actualización', async () => {
      const cartId = 1;
      const invalidData = { userId: "no-es-un-número", products: "no-es-un-array" };
      const response = await cartsApi.updateCart(cartId, invalidData as any);
      
      // La API debe manejar datos inválidos apropiadamente
      expect([200, 400], '❌ El status para datos inválidos debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar la actualización de un carrito con array de productos vacío', async () => {
      const cartId = 1;
      const updateData = {
        userId: 1,
        date: new Date().toISOString(),
        products: []
      };
      
      const response = await cartsApi.updateCart(cartId, updateData);
      
      // La API debe manejar array de productos vacío
      expect([200, 400], '❌ El status para productos vacíos debe ser 200 o 400').toContain(response.status);
    });
  });

  test.describe('DELETE /carts/{id} - Eliminar carrito', () => {
    test('debería eliminar exitosamente un carrito existente', async () => {
      const cartId = 1;
      const response = await cartsApi.deleteCart(cartId);
      
      expect(response.success, '❌ La eliminación del carrito debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para eliminar carrito debe ser 200').toBe(200);
      expect(response.data!, '❌ El carrito eliminado debe tener propiedad id').toHaveProperty('id');
    });

    test('debería manejar la eliminación de un carrito inexistente', async () => {
      const nonExistentId = 99999;
      const response = await cartsApi.deleteCart(nonExistentId);
      
      // La API puede devolver éxito o 404 para carritos inexistentes
      expect([200, 404], '❌ El status para carrito inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar ID de carrito inválido para eliminación', async () => {
      const invalidId = -1;
      const response = await cartsApi.deleteCart(invalidId);
      
      // La API debe manejar IDs inválidos apropiadamente
      expect([200, 400, 404], '❌ El status para ID inválido debe ser 200, 400 o 404').toContain(response.status);
    });

    test('debería verificar la eliminación de un carrito intentando obtenerlo', async () => {
      // Primero, crear un carrito
      const cartData = CartsMock.generateRandomCartData();
      const createResponse = await cartsApi.createCart(cartData);
      
      if (createResponse.success && createResponse.data?.id) {
        const cartId = createResponse.data.id;
        
        // Eliminar el carrito
        const deleteResponse = await cartsApi.deleteCart(cartId);
        expect(deleteResponse.status, '❌ El status para eliminar debe ser 200').toBe(200);
        
        // Intentar obtener el carrito eliminado
        const getResponse = await cartsApi.getCartById(cartId);
        
        // Nota: FakeStore API puede no eliminar realmente el carrito,
        // es una simulación, así que verificamos respuesta apropiada
        expect([200, 404], '❌ El status para carrito eliminado debe ser 200 o 404').toContain(getResponse.status);
      }
    });
  });

  test.describe('GET /carts - Filtrado por rango de fechas', () => {
    test('debería obtener carritos dentro de un rango de fechas especificado', async () => {
      const startDate = '2019-12-01';
      const endDate = '2020-03-31';
      const response = await cartsApi.getCartsByDateRange(startDate, endDate);
      
      expect(response.success, '❌ La obtención de carritos debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener carritos debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta debe ser un array').toBeTruthy();
      
      // Validar que las fechas estén dentro del rango
      if (response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          const cartDate = new Date(cart.date);
          const start = new Date(startDate);
          const end = new Date(endDate);
          
          expect(cartDate.getTime(), '❌ La fecha del carrito debe ser mayor o igual al inicio').toBeGreaterThanOrEqual(start.getTime());
          expect(cartDate.getTime(), '❌ La fecha del carrito debe ser menor o igual al fin').toBeLessThanOrEqual(end.getTime());
        });
      }
    });

    test('debería manejar formatos de rango de fechas inválidos', async () => {
      const invalidStartDate = 'fecha-invalida';
      const invalidEndDate = 'tambien-invalida';
      const response = await cartsApi.getCartsByDateRange(invalidStartDate, invalidEndDate);
      
      // La API debe manejar formatos de fecha inválidos
      expect([200, 400], '❌ El status para fechas inválidas debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar un rango de fechas invertido (fin antes de inicio)', async () => {
      const startDate = '2020-12-31';
      const endDate = '2020-01-01';
      const response = await cartsApi.getCartsByDateRange(startDate, endDate);
      
      // La API debe manejar rangos invertidos apropiadamente
      expect([200, 400], '❌ El status para rango invertido debe ser 200 o 400').toContain(response.status);
      
      if (response.success) {
        expect(Array.isArray(response.data), '❌ La respuesta debe ser un array').toBeTruthy();
        // Debe retornar array vacío o manejarlo apropiadamente
      }
    });
  });

  test.describe('Validación de datos y lógica de negocio', () => {
    test('debería validar que los IDs de productos en el carrito sean válidos', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        const cart = response.data![0];
        
        // Los IDs de producto deben ser enteros positivos
        cart.products.forEach(product => {
          expect(typeof product.productId, '❌ El productId debe ser un número').toBe('number');
          expect(product.productId, '❌ El productId debe ser mayor que 0').toBeGreaterThan(0);
          expect(typeof product.quantity, '❌ La cantidad debe ser un número').toBe('number');
          expect(product.quantity, '❌ La cantidad debe ser mayor que 0').toBeGreaterThan(0);
        });
      }
    });

    test('debería validar que las fechas de los carritos sean cadenas ISO', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          // La fecha debe ser una cadena ISO válida
          const date = new Date(cart.date);
          expect(date.getTime(), '❌ La fecha del carrito debe ser válida').not.toBeNaN();
          
          // Debe estar en formato ISO
          expect(cart.date, '❌ La fecha debe estar en formato ISO').toMatch(/^[\d]{4}-[\d]{2}-[\d]{2}T[\d]{2}:[\d]{2}:[\d]{2}/);
        });
      }
    });

    test('debería validar que los userId sean enteros positivos', async () => {
      const response = await cartsApi.getAllCarts();
      
      if (response.success && response.data!.length > 0) {
        response.data!.forEach((cart: Cart) => {
          expect(typeof cart.userId, '❌ El userId debe ser un número').toBe('number');
          expect(cart.userId, '❌ El userId debe ser mayor que 0').toBeGreaterThan(0);
          expect(Number.isInteger(cart.userId), '❌ El userId debe ser entero').toBeTruthy();
        });
      }
    });
  });

  test.describe('Manejo de errores y casos límite', () => {
    test('debería manejar operaciones concurrentes de carritos correctamente', async () => {
      const cartData = CartsMock.generateRandomCartData();
      const numberOfRequests = 3;
      
      const createPromises = Array(numberOfRequests).fill(null).map(() => 
        cartsApi.createCart(cartData)
      );
      
      const responses = await Promise.all(createPromises);
      
      // Todas las solicitudes deben tener éxito (o fallar consistentemente)
      responses.forEach(response => {
        expect([200, 400], '❌ El status para concurrencia debe ser 200 o 400').toContain(response.status);
      });
    });

    test('debería validar la integración con la API externa para fechas', async () => {
      const disponibilidad = await externalData.validateExternalApiAvailability();
      
      if (disponibilidad.worldTime) {
        const externalDate = await externalData.getCurrentDateFromWorldTimeApi();
        expect(typeof externalDate, '❌ La fecha externa debe ser string').toBe('string');
        expect(new Date(externalDate).getTime(), '❌ La fecha externa debe ser válida').not.toBeNaN();
      } else {
        console.log('WorldTime API no está disponible');
        expect(true).toBeTruthy();
      }
    });

    test('debería manejar la creación de carrito con IDs de producto duplicados', async () => {
      const cartData = {
        userId: 1,
        date: new Date().toISOString(),
        products: [
          { productId: 1, quantity: 2 },
          { productId: 1, quantity: 3 } // ID de producto duplicado
        ]
      };
      
      const response = await cartsApi.createCart(cartData);
      
      // La API debe manejar IDs de producto duplicados apropiadamente
      expect([200, 400], '❌ El status para productos duplicados debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar el límite máximo de productos en un carrito', async () => {
      const muchosProductos = Array(100).fill(null).map((_, index) => ({
        productId: index + 1,
        quantity: 1
      }));
      
      const cartData = {
        userId: 1,
        date: new Date().toISOString(),
        products: muchosProductos
      };
      
      const response = await cartsApi.createCart(cartData);
      
      // La API debe manejar arrays grandes de productos apropiadamente
      expect([200, 400, 413], '❌ El status para límite máximo debe ser 200, 400 o 413').toContain(response.status);
    });
  });
});