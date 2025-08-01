import { faker } from '@faker-js/faker';
import { CreateUserRequest } from '../interfaces/user.interface';
import { CreateProductRequest } from '../interfaces/product.interface';
import { CreateCartRequest } from '../interfaces/cart.interface';

/**
 * Utility class for generating test data using faker library
 */
export class DataGenerator {
  /**
   * Generate random user data using faker
   */
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

  /**
   * Generate random product data using faker
   */
  static generateRandomProduct(): CreateProductRequest {
    const categories = ["electronics", "jewelery", "men's clothing", "women's clothing"];
    return {
      title: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      description: faker.commerce.productDescription(),
      image: faker.image.urlPicsumPhotos({ width: 400, height: 400 }),
      category: faker.helpers.arrayElement(categories)
    };
  }

  /**
   * Generate random cart data using faker
   */
  static generateRandomCart(): CreateCartRequest {
    const numProducts = faker.number.int({ min: 1, max: 5 });
    const products = [];

    for (let i = 0; i < numProducts; i++) {
      products.push({
        productId: faker.number.int({ min: 1, max: 20 }),
        quantity: faker.number.int({ min: 1, max: 10 })
      });
    }

    return {
      userId: faker.number.int({ min: 1, max: 10 }),
      date: faker.date.recent().toISOString(),
      products
    };
  }

  /**
   * Generate invalid email addresses for negative testing
   */
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

  /**
   * Generate edge case strings for testing
   */
  static generateEdgeCaseStrings(): string[] {
    return [
      '', // Empty string
      ' ', // Whitespace
      '   ', // Multiple whitespaces
      'a'.repeat(1000), // Very long string
      '!@#$%^&*()_+', // Special characters
      '12345', // Numeric string
      'null', // String 'null'
      'undefined', // String 'undefined'
      '<script>alert("xss")</script>' // XSS attempt
    ];
  }

  /**
   * Generate boundary numbers for testing
   */
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