import { api } from './api';

export interface CheckoutItem {
  name: string;
  price: number;
  quantity: number;
}
export interface CheckoutData {
  orderId: string;
  items: CheckoutItem[];
  currency: string;
}
export interface CheckoutResponse {
  url: string;
}

export const createCheckout = (data: CheckoutData) =>
  api.post<CheckoutResponse>('/payment/checkout', data);
