import { api } from './api';
import type { Product } from '../types';

export type ProductQuery = Record<string, string | number | null | undefined>;

export const getProducts = (params: ProductQuery = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) q.set(k, String(v));
  });
  const qs = q.toString();
  return api.get<Product[]>(`/products${qs ? `?${qs}` : ''}`);
};
export const getProduct = (id: string) => api.get<Product>(`/products/${id}`);
export const createProduct = (data: FormData) =>
  api.post<Product>('/products', data);
export const updateProduct = (id: string, data: FormData) =>
  api.patch<Product>(`/products/${id}`, data);
export const deleteProductPhoto = (id: string, photoUrl: string) =>
  api.delete<Product>(`/products/${id}/photos`, { photoUrl });
export const deleteProduct = (id: string) =>
  api.delete<unknown>(`/products/${id}`);
