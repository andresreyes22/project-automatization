/**
 * Cart product interface
 */
export interface CartProduct {
  productId: number;
  quantity: number;
}

/**
 * Cart interface representing the structure of a cart from FakeStore API
 */
export interface Cart {
  id: number;
  userId: number;
  date: string;
  products: CartProduct[];
  __v?: number;
}

/**
 * Interface for creating a new cart
 */
export interface CreateCartRequest {
  userId: number;
  date: string;
  products: CartProduct[];
}

/**
 * Interface for updating a cart
 */
export interface UpdateCartRequest extends Partial<CreateCartRequest> {
  id?: number;
}