import { api } from './api';
import type { User } from '../types';

export interface SignUpData {
  fullName: string;
  email: string;
  age: number;
  password: string;
}
export interface SignInData {
  email: string;
  password: string;
}
export interface VerifyData {
  email: string;
  OTPCode: string;
}
export interface TokenResponse {
  token: string;
}

export const signUp = (data: SignUpData) => api.post<unknown>('/auth/sign-up', data);
export const verifyEmail = (data: VerifyData) =>
  api.post<TokenResponse>('/auth/verify', data);
export const resendCode = (data: { email: string }) =>
  api.post<unknown>('/auth/send', data);
export const signIn = (data: SignInData) =>
  api.post<TokenResponse>('/auth/sign-in', data);
export const currentUser = () => api.get<User>('/auth/current-user');
