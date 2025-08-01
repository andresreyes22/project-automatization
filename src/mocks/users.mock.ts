import { User, CreateUserRequest, LoginCredentials } from '../interfaces/user.interface';

/**
 * Mock data for users used in testing
 */
export class UsersMock {
  /**
   * Sample user data for testing
   */
  static readonly sampleUser: User = {
    id: 1,
    email: "john@gmail.com",
    username: "johnd",
    password: "m38rmF$",
    name: {
      firstname: "john",
      lastname: "doe"
    },
    address: {
      city: "kilcoole",
      street: "7835 new road",
      number: 3,
      zipcode: "12926-3874",
      geolocation: {
        lat: "-37.3159",
        long: "81.1496"
      }
    },
    phone: "1-570-236-7033"
  };

  /**
   * Valid user creation data
   */
  static readonly validCreateUserData: CreateUserRequest = {
    email: "test@example.com",
    username: "testuser",
    password: "testpass123",
    name: {
      firstname: "Test",
      lastname: "User"
    },
    address: {
      city: "Test City",
      street: "123 Test Street",
      number: 456,
      zipcode: "12345",
      geolocation: {
        lat: "40.7128",
        long: "-74.0060"
      }
    },
    phone: "555-123-4567"
  };

  /**
   * Invalid user creation data (missing required fields)
   */
  static readonly invalidCreateUserData = {
    email: "invalid-email", // Invalid email format
    username: "", // Empty username
    // Missing password and other required fields
  };

  /**
   * Valid login credentials
   */
  static readonly validLoginCredentials: LoginCredentials = {
    username: "mor_2314",
    password: "83r5^_"
  };

  /**
   * Invalid login credentials
   */
  static readonly invalidLoginCredentials: LoginCredentials = {
    username: "nonexistent",
    password: "wrongpassword"
  };

  /**
   * Required user fields for validation
   */
  static readonly requiredUserFields: string[] = [
    'id',
    'email',
    'username',
    'password',
    'name',
    'address',
    'phone'
  ];

  /**
   * Required user name fields for validation
   */
  static readonly requiredNameFields: string[] = [
    'firstname',
    'lastname'
  ];

  /**
   * Required user address fields for validation
   */
  static readonly requiredAddressFields: string[] = [
    'city',
    'street',
    'number',
    'zipcode',
    'geolocation'
  ];

  /**
   * Generate dynamic user data with random values
   */
  static generateRandomUserData(): CreateUserRequest {
    const timestamp = Date.now();
    return {
      email: `test${timestamp}@example.com`,
      username: `testuser${timestamp}`,
      password: "testpass123",
      name: {
        firstname: "Test",
        lastname: `User${timestamp}`
      },
      address: {
        city: "Test City",
        street: `${timestamp} Test Street`,
        number: Math.floor(Math.random() * 9999) + 1,
        zipcode: `${Math.floor(Math.random() * 90000) + 10000}`,
        geolocation: {
          lat: (Math.random() * 180 - 90).toFixed(4),
          long: (Math.random() * 360 - 180).toFixed(4)
        }
      },
      phone: `555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`
    };
  }

  /**
   * Invalid user data with wrong data types
   */
  static readonly invalidDataTypes = {
    email: 123, // Should be string
    username: null, // Should be string
    password: true, // Should be string
    name: "not-an-object", // Should be object
    address: "not-an-object", // Should be object
    phone: 1234567890 // Should be string
  };
}