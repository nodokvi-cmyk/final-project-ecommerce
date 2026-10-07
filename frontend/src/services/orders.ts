import { api } from './api';
import type { Order, OrderItem, OrderStatus } from '../types';

export interface CreateOrderData {
  shippingAddress: string;
  orderedItems: OrderItem[];
}

export const createOrder = (data: CreateOrderData) =>
  api.post<Order>('/orders', data);
export const getMyOrders = () => api.get<Order[]>('/orders/my-orders');
export const getOrder = (id: string) => api.get<Order>(`/orders/${id}`);
export const getAllOrders = () => api.get<Order[]>('/orders');
export const updateOrder = (id: string, data: { status: OrderStatus }) =>
  api.patch<Order>(`/orders/${id}`, data);
export const deleteOrder = (id: string) => api.delete<unknown>(`/orders/${id}`);
