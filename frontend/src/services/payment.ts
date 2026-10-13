import { api } from './api';
import type { OrderStatus } from '../types';

export interface CheckoutData {
  orderId: string;
}
export interface CheckoutResponse {
  url: string;
}

export interface ConfirmResponse {
  orderId: string;
  status: OrderStatus;
}

export const confirmPayment = (sessionId: string) =>
  api.post<ConfirmResponse>('/payment/confirm', { sessionId });

export const createCheckout = (data: CheckoutData) =>
  api.post<CheckoutResponse>('/payment/checkout', data);
