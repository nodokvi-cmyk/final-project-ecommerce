import { api } from './api';
import type { Product } from '../types';

export type ProductQuery = Record<string, string | number | null | undefined>;

const toQueryString = (params: ProductQuery) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== '' && v !== undefined && v !== null) q.set(k, String(v));
  });
  const qs = q.toString();
  return qs ? `?${qs}` : '';
};

export const getProducts = (params: ProductQuery = {}) =>
  api.get<Product[]>(`/products${toQueryString(params)}`);
// Number of products matching the filters, ignoring page and take.
export const getProductCount = (params: ProductQuery = {}) =>
  api.get<{ total: number }>(`/products/count${toQueryString(params)}`);
export const getCategories = () => api.get<string[]>('/products/categories');
export const getProduct = (id: string) => api.get<Product>(`/products/${id}`);
export const createProduct = (data: FormData) =>
  api.post<Product>('/products', data);
export const updateProduct = (id: string, data: FormData) =>
  api.patch<Product>(`/products/${id}`, data);
export const deleteProductPhoto = (id: string, photoUrl: string) =>
  api.delete<Product>(`/products/${id}/photos`, { photoUrl });
export const deleteProduct = (id: string) =>
  api.delete<unknown>(`/products/${id}`);
