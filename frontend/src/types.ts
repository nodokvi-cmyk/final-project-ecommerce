export type Role = 'admin' | 'user';

export interface User {
  _id: string;
  fullName: string;
  email: string;
  age: number;
  role: Role;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface Product {
  _id: string;
  productName: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  photos?: string[];
}

export interface CartItem {
  _id: string;
  productId: string;
  quantity: number;
  price: number;
  product?: Product;
}

export interface Cart {
  items: CartItem[];
  totalPrice: number;
}

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'shipped'
  | 'delivered'
  | 'cancelled';

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  _id: string;
  orderedItems: OrderItem[];
  totalAmount: number;
  shippingAddress: string;
  status: OrderStatus;
  createdAt: string;
}
