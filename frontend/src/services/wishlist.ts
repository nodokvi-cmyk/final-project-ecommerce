import { api } from './api';
import type { Product } from '../types';

export const getWishlist = () => api.get<Product[]>('/wishlist');
export const addToWishlist = (productId: string) =>
  api.post<string[]>('/wishlist', { productId });
export const removeFromWishlist = (productId: string) =>
  api.delete<string[]>(`/wishlist/${productId}`);
