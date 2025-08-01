/**
 * Product interface representing the structure of a product from FakeStore API
 */
export interface Product {
  id: number;
  title: string;
  price: number;
  description: string;
  category: string;
  image: string;
  rating?: {
    rate: number;
    count: number;
  };
}

/**
 * Interface for creating a new product
 */
export interface CreateProductRequest {
  title: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

/**
 * Interface for updating a product
 */
export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id?: number;
}

/**
 * Product categories available in the FakeStore API
 */
export type ProductCategory = 
  | "electronics" 
  | "jewelery" 
  | "men's clothing" 
  | "women's clothing";