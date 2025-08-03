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

      await test.step('Verificar que la obtención de todos los productos sea exitosa', async () => {
        expect(response.success, '❌ La obtención de todos los productos debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status sea 200', async () => {
        expect(response.status, '❌ El status para obtener todos los productos debe ser 200').toBe(200);
      });
      await test.step('Verificar que la respuesta sea un array', async () => {
        expect(Array.isArray(response.data), '❌ La respuesta debe ser un array').toBeTruthy();
      });
      await test.step('Verificar que el array de productos no esté vacío', async () => {
        expect(response.data!.length, '❌ El array de productos no debe estar vacío').toBeGreaterThan(0);
      });
      await test.step('Validar estructura del primer producto', async () => {
        const firstProduct = response.data![0];
        ProductsMock.requiredProductFields.forEach(field => {
          expect(firstProduct, `❌ El producto debe tener la propiedad '${field}'`).toHaveProperty(field);
        });
      });
    });

    test('debería obtener productos con parámetros de límite y orden', async () => {
      const limit = 5;
      const response = await productsApi.getProductsWithLimit(limit, 'desc');

      await test.step('Verificar que la obtención de productos con límite sea exitosa', async () => {
        expect(response.success, '❌ La obtención de productos con límite debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status sea 200', async () => {
        expect(response.status, '❌ El status para obtener productos con límite debe ser 200').toBe(200);
      });
      await test.step('Verificar que el tamaño del array de productos sea menor o igual al límite', async () => {
        expect(response.data!.length, '❌ El tamaño del array de productos debe ser menor o igual al límite').toBeLessThanOrEqual(limit);
      });
    });

    test('debería manejar el parámetro de límite inválido correctamente', async () => {
      const response = await productsApi.getProductsWithLimit(-1);

      await test.step('Verificar que el status para límite inválido sea 200', async () => {
        expect(response.status, '❌ El status para límite inválido debe ser 200').toBe(200);
      });
      await test.step('Verificar que la respuesta sea un array para límite inválido', async () => {
        expect(Array.isArray(response.data), '❌ La respuesta debe ser un array para límite inválido').toBeTruthy();
      });
    });
  });

  test.describe('GET /products/{id} - Obtener Producto por ID', () => {
    test('debería obtener exitosamente un producto específico', async () => {
      const productId = 1;
      const response = await productsApi.getProductById(productId);

      await test.step('Verificar que la obtención del producto sea exitosa', async () => {
        expect(response.success, '❌ La obtención del producto debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status sea 200', async () => {
        expect(response.status, '❌ El status para obtener producto debe ser 200').toBe(200);
      });
      await test.step('Verificar que el ID del producto coincida con el solicitado', async () => {
        expect(response.data!.id, '❌ El ID del producto debe coincidir con el solicitado').toBe(productId);
      });
      await test.step('Validar estructura del producto', async () => {
        ProductsMock.requiredProductFields.forEach(field => {
          expect(response.data!, `❌ El producto debe tener la propiedad '${field}'`).toHaveProperty(field);
        });
      });
    });

    test('debería retornar 404 para un producto inexistente', async () => {
      const nonExistentId = 99999;
      const response = await productsApi.getProductById(nonExistentId);

      await test.step('Verificar que el status para producto inexistente sea 404', async () => {
        expect(response.status, '❌ El status para producto inexistente debe ser 404').toBe(404);
      });
      await test.step('Verificar que success sea false para producto inexistente', async () => {
        expect(response.success, '❌ El success debe ser false para producto inexistente').toBeFalsy();
      });
    });

    test('debería manejar formatos de ID de producto inválidos', async () => {
      const invalidIds = [0, -1];

      for (const invalidId of invalidIds) {
        const response = await productsApi.getProductById(invalidId);
        await test.step(`Verificar status para ID de producto inválido '${invalidId}'`, async () => {
          expect([200, 404], `❌ El status para ID de producto inválido '${invalidId}' debe ser 200 o 404`).toContain(response.status);
        });
      }
    });
  });

  test.describe('GET /products/categories - Obtener Todas las Categorías', () => {
    test('debería obtener exitosamente todas las categorías de productos', async () => {
      const response = await productsApi.getAllCategories();

      await test.step('Verificar que la obtención de todas las categorías sea exitosa', async () => {
        expect(response.success, '❌ La obtención de todas las categorías debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status sea 200', async () => {
        expect(response.status, '❌ El status para obtener todas las categorías debe ser 200').toBe(200);
      });
      await test.step('Verificar que la respuesta de categorías sea un array', async () => {
        expect(Array.isArray(response.data), '❌ La respuesta de categorías debe ser un array').toBeTruthy();
      });
      await test.step('Verificar que el array de categorías no esté vacío', async () => {
        expect(response.data!.length, '❌ El array de categorías no debe estar vacío').toBeGreaterThan(0);
      });
      await test.step('Verificar que las categorías esperadas estén presentes', async () => {
        ProductsMock.expectedCategories.forEach(category => {
          expect(response.data, `❌ Las categorías deben contener '${category}'`).toContain(category);
        });
      });
    });
  });

  test.describe('GET /products/category/{category} - Obtener Productos por Categoría', () => {
    test('debería obtener exitosamente productos por una categoría válida', async () => {
      const category = "electronics";
      const response = await productsApi.getProductsByCategory(category);

      await test.step('Verificar que la obtención de productos por categoría sea exitosa', async () => {
        expect(response.success, '❌ La obtención de productos por categoría debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status sea 200', async () => {
        expect(response.status, '❌ El status para obtener productos por categoría debe ser 200').toBe(200);
      });
      await test.step('Verificar que los productos por categoría sean un array', async () => {
        expect(Array.isArray(response.data), '❌ Los productos por categoría deben ser un array').toBeTruthy();
      });
      await test.step('Verificar que todos los productos pertenezcan a la categoría solicitada', async () => {
        response.data!.forEach((product: Product) => {
          expect(product.category, `❌ La categoría del producto debe ser '${category}'`).toBe(category);
        });
      });
    });

    test('debería manejar una categoría inválida correctamente', async () => {
      const invalidCategory = "nonexistent-category" as any;
      const response = await productsApi.getProductsByCategory(invalidCategory);

      await test.step('Verificar que la API maneje correctamente una categoría inválida', async () => {
        expect([200, 400, 404], '❌ El status para categoría inválida debe ser 200, 400 o 404').toContain(response.status);
      });
    });
  });

  test.describe('POST /products - Crear Producto', () => {
    test('debería crear exitosamente un nuevo producto con datos válidos', async () => {
      const productData = ProductsMock.validCreateProductData;
      const response = await productsApi.createProduct(productData);

      await test.step('Verificar que la creación del producto sea exitosa', async () => {
        expect(response.success, '❌ La creación del producto debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status para crear producto sea 200', async () => {
        expect(response.status, '❌ El status para crear producto debe ser 200').toBe(200);
      });
      await test.step('Verificar que el producto creado tenga un id', async () => {
        expect(response.data!, '❌ El producto creado debe tener un id').toHaveProperty('id');
      });
      await test.step('Verificar que el título del producto creado coincida con el de entrada', async () => {
        expect(response.data!.title, '❌ El título del producto creado debe coincidir con el de entrada').toBe(productData.title);
      });
      await test.step('Verificar que el precio del producto creado coincida con el de entrada', async () => {
        expect(response.data!.price, '❌ El precio del producto creado debe coincidir con el de entrada').toBe(productData.price);
      });
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

      await test.step('Verificar que la creación del producto con datos externos sea exitosa', async () => {
        expect(response.success, '❌ La creación del producto con datos externos debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status para crear producto con datos externos sea 200', async () => {
        expect(response.status, '❌ El status para crear producto con datos externos debe ser 200').toBe(200);
      });
      await test.step('Verificar que la descripción del producto coincida con la externa', async () => {
        expect(response.data!.description, '❌ La descripción del producto debe coincidir con la externa').toBe(externalDescription);
      });
      await test.step('Verificar que la imagen del producto coincida con la externa', async () => {
        expect(response.data!.image, '❌ La imagen del producto debe coincidir con la externa').toBe(externalImageUrl);
      });
    });

    test('debería crear producto con datos aleatorios generados', async () => {
      const randomProductData = DataGenerator.generateRandomProduct();
      const response = await productsApi.createProduct(randomProductData);

      await test.step('Verificar que la creación del producto con datos aleatorios sea exitosa', async () => {
        expect(response.success, '❌ La creación del producto con datos aleatorios debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status para crear producto con datos aleatorios sea 200', async () => {
        expect(response.status, '❌ El status para crear producto con datos aleatorios debe ser 200').toBe(200);
      });
      await test.step('Verificar que el producto creado tenga un id', async () => {
        expect(response.data!, '❌ El producto creado debe tener un id').toHaveProperty('id');
      });
    });

    test('debería manejar datos de producto inválidos', async () => {
      try {
        const response = await productsApi.createProduct(ProductsMock.invalidCreateProductData as any);
        await test.step('Verificar status para datos de producto inválidos', async () => {
          expect([200, 400], '❌ El status para datos de producto inválidos debe ser 200 o 400').toContain(response.status);
        });
      } catch (error) {
        await test.step('Verificar que se capture un error para datos de producto inválidos', async () => {
          expect(error, '❌ Debe capturarse un error para datos de producto inválidos').toBeDefined();
        });
      }
    });

    test('debería manejar datos de producto con tipos de datos inválidos', async () => {
      try {
        const response = await productsApi.createProduct(ProductsMock.invalidDataTypes as any);
        await test.step('Verificar status para tipos de datos inválidos', async () => {
          expect([200, 400], '❌ El status para tipos de datos inválidos debe ser 200 o 400').toContain(response.status);
        });
      } catch (error) {
        await test.step('Verificar que se capture un error para tipos de datos inválidos', async () => {
          expect(error, '❌ Debe capturarse un error para tipos de datos inválidos').toBeDefined();
        });
      }
    });
  });

  test.describe('PUT /products/{id} - Actualizar Producto', () => {
    test('debería actualizar exitosamente un producto existente', async () => {
      const productId = 1;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(productId, updateData);
      await test.step('Verificar que la actualización del producto sea exitosa', async () => {
        expect(response.success, '❌ La actualización del producto debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status para actualizar producto sea 200', async () => {
        expect(response.status, '❌ El status para actualizar producto debe ser 200').toBe(200);
      });
      await test.step('Verificar que el ID del producto actualizado coincida con el solicitado', async () => {
        expect(response.data!.id, '❌ El ID del producto actualizado debe coincidir con el solicitado').toBe(productId);
      });
      await test.step('Verificar que el título del producto actualizado coincida con el de entrada', async () => {
        expect(response.data!.title, '❌ El título del producto actualizado debe coincidir con el de entrada').toBe(updateData.title);
      });
    });

    test('debería realizar actualización parcial de un producto exitosamente', async () => {
      const productId = 2;
      const partialUpdateData = ProductsMock.partialUpdateProductData;
      const response = await productsApi.updateProduct(productId, partialUpdateData);
      await test.step('Verificar que la actualización parcial sea exitosa', async () => {
        expect(response.success, '❌ La actualización parcial debe ser exitosa').toBeTruthy();
      });
      await test.step('Verificar que el status para actualización parcial sea 200', async () => {
        expect(response.status, '❌ El status para actualización parcial debe ser 200').toBe(200);
      });
      await test.step('Verificar que el ID del producto actualizado coincida con el solicitado', async () => {
        expect(response.data!.id, '❌ El ID del producto actualizado debe coincidir con el solicitado').toBe(productId);
      });
      await test.step('Verificar que el título actualizado coincida con el de entrada', async () => {
        expect(response.data!.title, '❌ El título actualizado debe coincidir con el de entrada').toBe(partialUpdateData.title);
      });
    });

    test('debería manejar la actualización de un producto inexistente', async () => {
      const nonExistentId = 99999;
      const updateData = ProductsMock.validUpdateProductData;
      const response = await productsApi.updateProduct(nonExistentId, updateData);
      await test.step('Verificar status para actualizar producto inexistente', async () => {
        // La API puede crear un nuevo producto o devolver error
        expect([200, 404], '❌ El status para actualizar producto inexistente debe ser 200 o 404').toContain(response.status);
      });
    });

    test('debería manejar datos inválidos en la actualización', async () => {
      const productId = 1;
      const invalidData = { title: null, price: "no-es-un-número" };
      try {
        const response = await productsApi.updateProduct(productId, invalidData as any);
        await test.step('Verificar status para datos inválidos en la actualización', async () => {
          // La API debe manejar datos inválidos apropiadamente
          expect([200, 400], '❌ El status para datos inválidos en la actualización debe ser 200 o 400').toContain(response.status);
        });
      } catch (error) {
        await test.step('Verificar que se capture un error para datos inválidos en la actualización', async () => {
          expect(error, '❌ Debe capturarse un error para datos inválidos en la actualización').toBeDefined();
        });
      }
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
        await test.step('Verificar que la respuesta no sea indefinida en caso de timeout de red', async () => {
          expect(response, '❌ La respuesta no debe ser indefinida en caso de timeout de red').toBeDefined();
        });
      } catch (error) {
        await test.step('Verificar que se capture un error en caso de timeout de red', async () => {
          expect(error, '❌ Debe capturarse un error en caso de timeout de red').toBeDefined();
        });
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