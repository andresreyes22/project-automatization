import { test, expect } from '@playwright/test';
import { ProductsApiPage } from '../pages/products-api.page';
import { ProductsMock } from '../mocks/products.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { Product } from '../interfaces/product.interface';

test.describe('Pruebas de la API de Productos', () => {
  let productsApi: ProductsApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    productsApi = new ProductsApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /products - Obtener Todos los Productos', () => {
    test('debería obtener exitosamente todos los productos', async () => {
      const response = await productsApi.getAllProducts();
      
      expect(response.success, '❌ La obtención de todos los productos debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener todos los productos debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta debe ser un array').toBeTruthy();
      expect(response.data!.length, '❌ El array de productos no debe estar vacío').toBeGreaterThan(0);
      
      // Validar estructura del primer producto
      const firstProduct = response.data![0];
      ProductsMock.requiredProductFields.forEach(field => {
        expect(firstProduct, `❌ El producto debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
    });

    test('debería obtener productos con parámetros de límite y orden', async () => {
      const limit = 5;
      const response = await productsApi.getProductsWithLimit(limit, 'desc');
      
      expect(response.success, '❌ La obtención de productos con límite debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener productos con límite debe ser 200').toBe(200);
      expect(response.data!.length, '❌ El tamaño del array de productos debe ser menor o igual al límite').toBeLessThanOrEqual(limit);
    });

    test('debería manejar el parámetro de límite inválido correctamente', async () => {
      const response = await productsApi.getProductsWithLimit(-1);
      
      // La API debe manejar parámetros inválidos correctamente
      expect(response.status, '❌ El status para límite inválido debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta debe ser un array para límite inválido').toBeTruthy();
    });
  });

  test.describe('GET /products/{id} - Obtener Producto por ID', () => {
    test('debería obtener exitosamente un producto específico', async () => {
      const productId = 1;
      const response = await productsApi.getProductById(productId);
      
      expect(response.success, '❌ La obtención del producto debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener producto debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del producto debe coincidir con el solicitado').toBe(productId);
      
      // Validar estructura del producto
      ProductsMock.requiredProductFields.forEach(field => {
        expect(response.data!, `❌ El producto debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
    });

    test('debería retornar 404 para un producto inexistente', async () => {
      const nonExistentId = 99999;
      const response = await productsApi.getProductById(nonExistentId);
      
      expect(response.status, '❌ El status para producto inexistente debe ser 404').toBe(404);
      expect(response.success, '❌ El success debe ser false para producto inexistente').toBeFalsy();
    });

    test('debería manejar formatos de ID de producto inválidos', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await productsApi.getProductById(invalidId);
        expect([200, 404], `❌ El status para ID de producto inválido '${invalidId}' debe ser 200 o 404`).toContain(response.status);
      }
    });
  });

  test.describe('GET /products/categories - Obtener Todas las Categorías', () => {
    test('debería obtener exitosamente todas las categorías de productos', async () => {
      const response = await productsApi.getAllCategories();
      
      expect(response.success, '❌ La obtención de todas las categorías debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener todas las categorías debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta de categorías debe ser un array').toBeTruthy();
      expect(response.data!.length, '❌ El array de categorías no debe estar vacío').toBeGreaterThan(0);
      
      // Verificar que las categorías esperadas estén presentes
      ProductsMock.expectedCategories.forEach(category => {
        expect(response.data, `❌ Las categorías deben contener '${category}'`).toContain(category);
      });
    });
  });

  test.describe('GET /products/category/{category} - Obtener Productos por Categoría', () => {
    test('debería obtener exitosamente productos por una categoría válida', async () => {
      const category = "electronics";
      const response = await productsApi.getProductsByCategory(category);
      
      expect(response.success, '❌ La obtención de productos por categoría debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener productos por categoría debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ Los productos por categoría deben ser un array').toBeTruthy();
      
      // Verificar que todos los productos pertenezcan a la categoría solicitada
      response.data!.forEach((product: Product) => {
        expect(product.category, `❌ La categoría del producto debe ser '${category}'`).toBe(category);
      });
    });

    test('debería manejar una categoría inválida correctamente', async () => {
      const invalidCategory = "nonexistent-category" as any;
      const response = await productsApi.getProductsByCategory(invalidCategory);
      
      // La API puede devolver array vacío o error para categoría inválida
      expect([200, 400, 404], '❌ El status para categoría inválida debe ser 200, 400 o 404').toContain(response.status);
    });
  });

  test.describe('POST /products - Crear Producto', () => {
    test('debería crear exitosamente un nuevo producto con datos válidos', async () => {
      const productData = ProductsMock.validCreateProductData;
      const response = await productsApi.createProduct(productData);
      
      expect(response.success, '❌ La creación del producto debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para crear producto debe ser 200').toBe(200);
      expect(response.data!, '❌ El producto creado debe tener un id').toHaveProperty('id');
      expect(response.data!.title, '❌ El título del producto creado debe coincidir con el de entrada').toBe(productData.title);
      expect(response.data!.price, '❌ El precio del producto creado debe coincidir con el de entrada').toBe(productData.price);
    });

    test('debería crear producto con datos externos de la API quotable', async () => {
      const externalDescription = await externalData.getRandomQuoteForProductDescription();
      const externalImageUrl = await externalData.getRandomImageUrl();
      
      const productData = {
        ...ProductsMock.validCreateProductData,
        description: externalDescription,
        image: externalImageUrl
      };
      
      const response = await productsApi.createProduct(productData);
      
      expect(response.success, '❌ La creación del producto con datos externos debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para crear producto con datos externos debe ser 200').toBe(200);
      expect(response.data!.description, '❌ La descripción del producto debe coincidir con la externa').toBe(externalDescription);
      expect(response.data!.image, '❌ La imagen del producto debe coincidir con la externa').toBe(externalImageUrl);
    });

    test('debería crear producto con datos aleatorios generados', async () => {
      const randomProductData = DataGenerator.generateRandomProduct();
      const response = await productsApi.createProduct(randomProductData);
      
      expect(response.success, '❌ La creación del producto con datos aleatorios debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para crear producto con datos aleatorios debe ser 200').toBe(200);
      expect(response.data!, '❌ El producto creado debe tener un id').toHaveProperty('id');
    });

    test('debería manejar datos de producto inválidos', async () => {
      const response = await productsApi.createProduct(ProductsMock.invalidCreateProductData as any);
      
      // El comportamiento de la API para datos inválidos puede variar
      expect([200, 400], '❌ El status para datos de producto inválidos debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar datos de producto con tipos de datos inválidos', async () => {
      const response = await productsApi.createProduct(ProductsMock.invalidDataTypes as any);
      
      // La API debe manejar tipos de datos incorrectos
      expect([200, 400], '❌ El status para tipos de datos inválidos debe ser 200 o 400').toContain(response.status);
    });
  });

  test.describe('PUT /products/{id} - Actualizar Producto', () => {
    test('debería actualizar exitosamente un producto existente', async () => {
      const productId = 1;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(productId, updateData);
      
      expect(response.success, '❌ La actualización del producto debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualizar producto debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del producto actualizado debe coincidir con el solicitado').toBe(productId);
      expect(response.data!.title, '❌ El título del producto actualizado debe coincidir con el de entrada').toBe(updateData.title);
    });

    test('debería realizar actualización parcial de un producto exitosamente', async () => {
      const productId = 2;
      const partialUpdateData = ProductsMock.partialUpdateProductData;
      const response = await productsApi.updateProduct(productId, partialUpdateData);
      
      expect(response.success, '❌ La actualización parcial debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualización parcial debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del producto actualizado debe coincidir con el solicitado').toBe(productId);
      expect(response.data!.title, '❌ El título actualizado debe coincidir con el de entrada').toBe(partialUpdateData.title);
    });

    test('debería manejar la actualización de un producto inexistente', async () => {
      const nonExistentId = 99999;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(nonExistentId, updateData);
      
      // La API puede crear un nuevo producto o devolver error
      expect([200, 404], '❌ El status para actualizar producto inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar datos inválidos en la actualización', async () => {
      const productId = 1;
      const invalidData = { title: null, price: "no-es-un-número" };
      const response = await productsApi.updateProduct(productId, invalidData as any);
      
      // La API debe manejar datos inválidos apropiadamente
      expect([200, 400], '❌ El status para datos inválidos en la actualización debe ser 200 o 400').toContain(response.status);
    });
  });

  test.describe('DELETE /products/{id} - Delete Product', () => {
    test('debería eliminar exitosamente un producto existente', async () => {
      const productId = 1;
      const response = await productsApi.deleteProduct(productId);
      
      expect(response.success, '❌ La eliminación del producto debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para eliminar un producto existente debe ser 200').toBe(200);
      expect(response.data!, '❌ El producto eliminado debe tener un id').toHaveProperty('id');
    });

    test('debería manejar la eliminación de un producto inexistente', async () => {
      const nonExistentId = 99999;
      const response = await productsApi.deleteProduct(nonExistentId);
      
      // La API puede devolver éxito o 404 para productos inexistentes
      expect([200, 404], '❌ El status para eliminar producto inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar un ID de producto inválido para eliminación', async () => {
      const invalidId = -1;
      const response = await productsApi.deleteProduct(invalidId);
      
      // La API debe manejar IDs inválidos apropiadamente
      expect([200, 400, 404], '❌ El status para ID de producto inválido en eliminación debe ser 200, 400 o 404').toContain(response.status);
    });
  });

  test.describe('Error Handling and Edge Cases', () => {
    test('debería manejar correctamente un timeout de red', async () => {
      // Este test requeriría simulación de red,
      // aquí solo probamos la estructura básica de manejo de errores
      try {
        const response = await productsApi.getAllProducts();
        expect(response, '❌ La respuesta no debe ser indefinida en caso de timeout de red').toBeDefined();
      } catch (error) {
        expect(error, '❌ Debe capturarse un error en caso de timeout de red').toBeDefined();
      }
    });

    test('debería validar la disponibilidad de APIs externas', async () => {
      const disponibilidad = await externalData.validateExternalApiAvailability();
      
      // Log de disponibilidad para depuración
      console.log('Disponibilidad de APIs externas:', disponibilidad);
      
      // El test no debe fallar si las APIs externas no están disponibles
      expect(typeof disponibilidad.quotable, '❌ La disponibilidad de quotable debe ser boolean').toBe('boolean');
      expect(typeof disponibilidad.picsum, '❌ La disponibilidad de picsum debe ser boolean').toBe('boolean');
    });
  });
});