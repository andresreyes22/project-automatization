import { Cart, CreateCartRequest, UpdateCartRequest, CartProduct } from '../interfaces/cart.interface';

/**
 * Mock data for carts used in testing
 */
export class CartsMock {
  /**
   * Sample cart data for testing
   */
  static readonly sampleCart: Cart = {
    id: 1,
    userId: 1,
    date: "2020-03-02T00:00:00.000Z",
    products: [
      { productId: 1, quantity: 4 },
      { productId: 2, quantity: 1 },
      { productId: 3, quantity: 6 }
    ],
    __v: 0
  };

  /**
   * Valid cart creation data
   */
  static readonly validCreateCartData: CreateCartRequest = {
    userId: 5,
    date: new Date().toISOString(),
    products: [
      { productId: 5, quantity: 1 },
      { productId: 1, quantity: 5 }
    ]
  };

  /**
   * Invalid cart creation data (missing required fields)
   */
  static readonly invalidCreateCartData = {
    userId: 1,
    // Missing date and products
  };

  /**
   * Valid cart update data
   */
  static readonly validUpdateCartData: UpdateCartRequest = {
    userId: 3,
    date: new Date().toISOString(),
    products: [
      { productId: 1, quantity: 3 }
    ]
  };

  /**
   * Cart update data with partial fields
   */
  static readonly partialUpdateCartData: UpdateCartRequest = {
    products: [
      { productId: 2, quantity: 10 }
    ]
  };

  /**
   * Required cart fields for validation
   */
  static readonly requiredCartFields: string[] = [
    'id',
    'userId',
    'date',
    'products'
  ];

  /**
   * Required cart product fields for validation
   */
  static readonly requiredCartProductFields: string[] = [
    'productId',
    'quantity'
  ];

  /**
   * Generate dynamic cart data with random values
   */
  static generateRandomCartData(): CreateCartRequest {
    const userId = Math.floor(Math.random() * 10) + 1;
    const numProducts = Math.floor(Math.random() * 5) + 1;
    const products: CartProduct[] = [];

    for (let i = 0; i < numProducts; i++) {
      products.push({
        productId: Math.floor(Math.random() * 20) + 1,
        quantity: Math.floor(Math.random() * 10) + 1
      });
    }

    return {
      userId,
      date: new Date().toISOString(),
      products
    };
  }

  /**
   * Generate cart data for a specific user
   */
  static generateCartDataForUser(userId: number): CreateCartRequest {
    return {
      userId,
      date: new Date().toISOString(),
      products: [
        { productId: 1, quantity: 2 },
        { productId: 5, quantity: 1 }
      ]
    };
  }

  /**
   * Invalid cart data with wrong data types
   */
  static readonly invalidDataTypes = {
    userId: "not-a-number", // Should be number
    date: 123456789, // Should be string
    products: "not-an-array" // Should be array
  };

  /**
   * Cart data with invalid product structure
   */
  static readonly invalidProductStructure = {
    userId: 1,
    date: new Date().toISOString(),
    products: [
      { productId: "not-a-number", quantity: 1 }, // Invalid productId type
      { productId: 2 }, // Missing quantity
      { quantity: 3 } // Missing productId
    ]
  };
}