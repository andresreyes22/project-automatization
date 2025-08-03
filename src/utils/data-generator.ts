

import { faker } from '@faker-js/faker';
import { CreateUserRequest } from '../interfaces/user.interface';
import { CreateProductRequest } from '../interfaces/product.interface';
import { CreateCartRequest } from '../interfaces/cart.interface';


/**
 * Clase utilitaria para generar datos de prueba usando faker
 */
export class DataGenerator {
  /** Genera datos de usuario aleatorios */
  static generateRandomUser(): CreateUserRequest {
    return {
      email: faker.internet.email(),
      username: faker.internet.userName(),
      password: faker.internet.password({ length: 8 }),
      name: {
        firstname: faker.person.firstName(),
        lastname: faker.person.lastName()
      },
      address: {
        city: faker.location.city(),
        street: faker.location.street(),
        number: parseInt(faker.location.buildingNumber()),
        zipcode: faker.location.zipCode(),
        geolocation: {
          lat: faker.location.latitude().toString(),
          long: faker.location.longitude().toString()
        }
      },
      phone: faker.phone.number()
    };
  }

  /** Genera datos de producto aleatorios */
  static generateRandomProduct(): CreateProductRequest {
    const categories = ["electronics", "jewelery", "men's clothing", "women's clothing"];
    return {
      title: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      // Usar la URL base de Picsum si está definida en el entorno
      image: `${process.env.PICSUM_URL || 'https://picsum.photos'}/400/400`,
      category: faker.helpers.arrayElement(categories)
    };
  }

  /** Genera datos de carrito aleatorios */
  static generateRandomCart(): CreateCartRequest {
    const numProducts = faker.number.int({ min: 1, max: 5 });
    const products = Array.from({ length: numProducts }, () => ({
      productId: faker.number.int({ min: 1, max: 20 }),
      quantity: faker.number.int({ min: 1, max: 10 })
    }));
    return {
      userId: faker.number.int({ min: 1, max: 10 }),
      date: faker.date.recent().toISOString(),
      products
    };
  }

  /** Genera emails inválidos para pruebas negativas */
  static generateInvalidEmails(): string[] {
    return [
      'invalid-email',
      'test@',
      '@domain.com',
      'test.domain.com',
      '',
      'test@domain',
      'test space@domain.com'
    ];
  }

  /** Genera cadenas edge case para pruebas */
  static generateEdgeCaseStrings(): string[] {
    return [
      '', // Cadena vacía
      ' ', // Espacio
      '   ', // Varios espacios
      'a'.repeat(1000), // Cadena muy larga
      '!@#$%^&*()_+', // Caracteres especiales
      '12345', // Cadena numérica
      'null', // String 'null'
      'undefined', // String 'undefined'
      '<script>alert("xss")</script>' // Intento de XSS
    ];
  }

  /** Genera números límite para pruebas */
  static generateBoundaryNumbers(): number[] {
    return [
      0,
      -1,
      1,
      0.01,
      -0.01,
      Number.MAX_SAFE_INTEGER,
      Number.MIN_SAFE_INTEGER,
      Infinity,
      -Infinity
    ];
  }
}