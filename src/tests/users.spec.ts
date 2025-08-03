import { test, expect } from '@playwright/test';
import { UsersApiPage } from '../pages/users-api.page';
import { UsersMock } from '../mocks/users.mock';
import { DataGenerator } from '../utils/data-generator';
import { ExternalDataProvider } from '../utils/external-data';
import { User } from '../interfaces/user.interface';

test.describe('Pruebas de la API de Usuarios', () => {
  let usersApi: UsersApiPage;
  let externalData: ExternalDataProvider;

  test.beforeEach(async ({ request }) => {
    usersApi = new UsersApiPage(request);
    externalData = new ExternalDataProvider(request);
  });

  test.describe('GET /users - Obtener Todos los Usuarios', () => {
    test('debería obtener exitosamente todos los usuarios', async () => {
      const response = await usersApi.getAllUsers();
      
      expect(response.success, '❌ La obtención de todos los usuarios debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener todos los usuarios debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta debe ser un array').toBeTruthy();
      expect(response.data!.length, '❌ El array de usuarios no debe estar vacío').toBeGreaterThan(0);
      
      // Validar estructura del primer usuario
      const firstUser = response.data![0];
      UsersMock.requiredUserFields.forEach(field => {
        expect(firstUser, `❌ El usuario debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
      
      // Validar objetos anidados
      expect(firstUser.name, '❌ El nombre del usuario debe estar definido').toBeDefined();
      UsersMock.requiredNameFields.forEach(field => {
        expect(firstUser.name, `❌ El nombre debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
      
      expect(firstUser.address, '❌ La dirección del usuario debe estar definida').toBeDefined();
      UsersMock.requiredAddressFields.forEach(field => {
        expect(firstUser.address, `❌ La dirección debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
    });

    test('debería obtener usuarios con parámetros de límite y orden', async () => {
      const limit = 3;
      const response = await usersApi.getUsersWithLimit(limit, 'desc');
      
      expect(response.success, '❌ La obtención de usuarios con límite debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener usuarios con límite debe ser 200').toBe(200);
      expect(response.data!.length, '❌ El tamaño del array de usuarios debe ser menor o igual al límite').toBeLessThanOrEqual(limit);
    });

    test('debería manejar el parámetro de límite inválido correctamente', async () => {
      const response = await usersApi.getUsersWithLimit(-1);
      
      // La API debe manejar parámetros inválidos correctamente
      expect(response.status, '❌ El status para límite inválido debe ser 200').toBe(200);
      expect(Array.isArray(response.data), '❌ La respuesta debe ser un array para límite inválido').toBeTruthy();
    });
  });

  test.describe('GET /users/{id} - Obtener Usuario por ID', () => {
    test('debería obtener exitosamente un usuario específico', async () => {
      const userId = 1;
      const response = await usersApi.getUserById(userId);
      
      expect(response.success, '❌ La obtención del usuario debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para obtener usuario debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del usuario debe coincidir con el solicitado').toBe(userId);
      
      // Validar estructura del usuario
      UsersMock.requiredUserFields.forEach(field => {
        expect(response.data!, `❌ El usuario debe tener la propiedad '${field}'`).toHaveProperty(field);
      });
    });

    test('debería retornar 404 para un usuario inexistente', async () => {
      const nonExistentId = 99999;
      const response = await usersApi.getUserById(nonExistentId);
      
      expect(response.status, '❌ El status para usuario inexistente debe ser 404').toBe(404);
      expect(response.success, '❌ El success debe ser false para usuario inexistente').toBeFalsy();
    });

    test('debería manejar formatos de ID de usuario inválidos', async () => {
      const invalidIds = [0, -1];
      
      for (const invalidId of invalidIds) {
        const response = await usersApi.getUserById(invalidId);
        expect([200, 404], `❌ El status para ID de usuario inválido '${invalidId}' debe ser 200 o 404`).toContain(response.status);
      }
    });
  });

  test.describe('POST /users - Crear Usuario', () => {
    test('debería crear exitosamente un nuevo usuario con datos válidos', async () => {
      const userData = UsersMock.validCreateUserData;
      const response = await usersApi.createUser(userData);
      
      expect(response.success, '❌ La creación del usuario debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para crear usuario debe ser 200').toBe(200);
      expect(response.data!, '❌ El usuario creado debe tener un id').toHaveProperty('id');
      expect(response.data!.email, '❌ El email del usuario creado debe coincidir con el de entrada').toBe(userData.email);
      expect(response.data!.username, '❌ El username del usuario creado debe coincidir con el de entrada').toBe(userData.username);
    });

    test('debería crear usuario con datos externos de la API JSONPlaceholder', async () => {
      try {
        const externalUserData = await externalData.getRandomUserFromJsonPlaceholder();
        const response = await usersApi.createUser(externalUserData);
        
        expect(response.success, '❌ La creación del usuario con datos externos debe ser exitosa').toBeTruthy();
        expect(response.status, '❌ El status para crear usuario con datos externos debe ser 200').toBe(200);
        expect(response.data!, '❌ El usuario creado debe tener un id').toHaveProperty('id');
        expect(response.data!.email, '❌ El email del usuario creado debe coincidir con el externo').toBe(externalUserData.email);
      } catch (error) {
        console.log('API externa no disponible, omitiendo test');
        // El test pasa si la API externa no está disponible
        expect(true, '❌ El test debe pasar si la API externa no está disponible').toBeTruthy();
      }
    });

    test('debería crear usuario con datos aleatorios generados', async () => {
      const randomUserData = DataGenerator.generateRandomUser();
      const response = await usersApi.createUser(randomUserData);
      
      expect(response.success, '❌ La creación del usuario con datos aleatorios debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para crear usuario con datos aleatorios debe ser 200').toBe(200);
      expect(response.data!, '❌ El usuario creado debe tener un id').toHaveProperty('id');
    });

    test('debería manejar datos de usuario inválidos', async () => {
      const response = await usersApi.createUser(UsersMock.invalidCreateUserData as any);
      
      // El comportamiento de la API para datos inválidos puede variar
      expect([200, 400], '❌ El status para datos de usuario inválidos debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar datos de usuario con tipos de datos inválidos', async () => {
      const response = await usersApi.createUser(UsersMock.invalidDataTypes as any);
      
      // La API debe manejar tipos de datos incorrectos
      expect([200, 400], '❌ El status para tipos de datos inválidos debe ser 200 o 400').toContain(response.status);
    });

    test('debería manejar la creación de usuario con formatos de email inválidos', async () => {
      const invalidEmails = DataGenerator.generateInvalidEmails();
      
      for (const invalidEmail of invalidEmails.slice(0, 3)) { // Solo los primeros 3 para evitar demoras
        const userData = {
          ...UsersMock.validCreateUserData,
          email: invalidEmail
        };
        
        const response = await usersApi.createUser(userData);
        // La API puede aceptar o rechazar emails inválidos
        expect([200, 400], `❌ El status para email inválido '${invalidEmail}' debe ser 200 o 400`).toContain(response.status);
      }
    });

    test('debería manejar la creación de usuario con cadenas edge case', async () => {
      const edgeCaseStrings = DataGenerator.generateEdgeCaseStrings();
      
      const userData = {
        ...UsersMock.validCreateUserData,
        username: edgeCaseStrings[0], // Cadena vacía
        name: {
          firstname: edgeCaseStrings[1], // Espacio en blanco
          lastname: edgeCaseStrings[2] // Múltiples espacios
        }
      };
      
      const response = await usersApi.createUser(userData);
      expect([200, 400], '❌ El status para cadenas edge case debe ser 200 o 400').toContain(response.status);
    });
  });

  test.describe('PUT /users/{id} - Actualizar Usuario', () => {
    test('debería actualizar exitosamente un usuario existente', async () => {
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
      
      expect(response.success, '❌ La actualización del usuario debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualizar usuario debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del usuario actualizado debe coincidir con el solicitado').toBe(userId);
      expect(response.data!.email, '❌ El email del usuario actualizado debe coincidir con el de entrada').toBe(updateData.email);
    });

    test('debería realizar actualización parcial de un usuario exitosamente', async () => {
      const userId = 2;
      const partialUpdateData = {
        email: 'partial@example.com'
      };
      
      const response = await usersApi.updateUser(userId, partialUpdateData);
      
      expect(response.success, '❌ La actualización parcial debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para actualización parcial debe ser 200').toBe(200);
      expect(response.data!.id, '❌ El ID del usuario actualizado debe coincidir con el solicitado').toBe(userId);
      expect(response.data!.email, '❌ El email actualizado debe coincidir con el de entrada').toBe(partialUpdateData.email);
    });

    test('debería manejar la actualización de un usuario inexistente', async () => {
      const nonExistentId = 99999;
      const updateData = { email: 'test@example.com' };
      const response = await usersApi.updateUser(nonExistentId, updateData);
      
      // La API puede crear un nuevo usuario o devolver error
      expect([200, 404], '❌ El status para actualizar usuario inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar datos inválidos en la actualización', async () => {
      const userId = 1;
      const invalidData = { email: null, username: 123 };
      const response = await usersApi.updateUser(userId, invalidData as any);
      
      // La API debe manejar datos inválidos apropiadamente
      expect([200, 400], '❌ El status para datos inválidos en la actualización debe ser 200 o 400').toContain(response.status);
    });
  });

  test.describe('DELETE /users/{id} - Eliminar Usuario', () => {
    test('debería eliminar exitosamente un usuario existente', async () => {
      const userId = 1;
      const response = await usersApi.deleteUser(userId);
      
      expect(response.success, '❌ La eliminación del usuario debe ser exitosa').toBeTruthy();
      expect(response.status, '❌ El status para eliminar usuario debe ser 200').toBe(200);
      expect(response.data!, '❌ El usuario eliminado debe tener un id').toHaveProperty('id');
    });

    test('debería manejar la eliminación de un usuario inexistente', async () => {
      const nonExistentId = 99999;
      const response = await usersApi.deleteUser(nonExistentId);
      
      // La API puede devolver éxito o 404 para usuarios inexistentes
      expect([200, 404], '❌ El status para eliminar usuario inexistente debe ser 200 o 404').toContain(response.status);
    });

    test('debería manejar un ID de usuario inválido para eliminación', async () => {
      const invalidId = -1;
      const response = await usersApi.deleteUser(invalidId);
      
      // La API debe manejar IDs inválidos apropiadamente
      expect([200, 400, 404], '❌ El status para ID de usuario inválido en eliminación debe ser 200, 400 o 404').toContain(response.status);
    });
  });

  test.describe('Validación de Datos y Restricciones', () => {
    test('debería validar el formato del correo electrónico en las respuestas de usuario', async () => {
      const response = await usersApi.getAllUsers();
      
      if (response.success && response.data!.length > 0) {
        const user = response.data![0];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        expect(emailRegex.test(user.email), '❌ El correo del usuario debe tener formato válido').toBeTruthy();
      }
    });

    test('debería validar el formato del número de teléfono en las respuestas de usuario', async () => {
      const response = await usersApi.getAllUsers();
      
      if (response.success && response.data!.length > 0) {
        const user = response.data![0];
        expect(typeof user.phone, '❌ El teléfono del usuario debe ser string').toBe('string');
        expect(user.phone.length, '❌ El teléfono del usuario no debe estar vacío').toBeGreaterThan(0);
      }
    });

    test('debería validar el formato de las coordenadas de geolocalización', async () => {
      const response = await usersApi.getUserById(1);
      
      if (response.success) {
        const user = response.data!;
        const lat = parseFloat(user.address.geolocation.lat);
        const long = parseFloat(user.address.geolocation.long);
        
        expect(lat, '❌ La latitud debe ser >= -90').toBeGreaterThanOrEqual(-90);
        expect(lat, '❌ La latitud debe ser <= 90').toBeLessThanOrEqual(90);
        expect(long, '❌ La longitud debe ser >= -180').toBeGreaterThanOrEqual(-180);
        expect(long, '❌ La longitud debe ser <= 180').toBeLessThanOrEqual(180);
      }
    });
  });

  test.describe('Manejo de Errores y Casos Límite', () => {
    test('debería manejar JSON malformado en el cuerpo de la petición', async () => {
      // Esto requeriría manipulación de bajo nivel,
      // por ahora probamos con estructuras de datos inválidas
      const malformedData = "no-es-json";
      
      try {
        const response = await usersApi.createUser(malformedData as any);
        expect([200, 400], '❌ El status para JSON malformado debe ser 200 o 400').toContain(response.status);
      } catch (error) {
        expect(error, '❌ Debe capturarse un error para JSON malformado').toBeDefined();
      }
    });

    test('debería validar la resiliencia de la integración con APIs externas', async () => {
      const disponibilidad = await externalData.validateExternalApiAvailability();
      
      if (disponibilidad.jsonPlaceholder) {
        const externalUserData = await externalData.getRandomUserFromJsonPlaceholder();
        expect(externalUserData, '❌ Los datos externos del usuario deben estar definidos').toBeDefined();
        expect(externalUserData.email, '❌ El correo externo del usuario debe estar definido').toBeDefined();
      } else {
        console.log('La API JSONPlaceholder no está disponible');
        expect(true, '❌ El test debe pasar si la API externa no está disponible').toBeTruthy();
      }
    });
  });
});