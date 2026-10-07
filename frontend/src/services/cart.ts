import { api } from './api';
import type { Cart } from '../types';

export const getCart = () => api.get<Cart>('/cart');
export const addToCart = (productId: string, quantity: number) =>
  api.post<Cart>('/cart', { productId, quantity });
export const updateCartItem = (id: string, quantity: number) =>
  api.patch<Cart>(`/cart/item/${id}`, { quantity });
export const removeCartItem = (id: string) => api.delete<Cart>(`/cart/${id}`);
export const clearCart = () => api.delete<Cart>('/cart');
