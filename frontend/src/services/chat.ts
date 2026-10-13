import { api } from './api';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatProduct {
  _id: string;
  productName: string;
  price: number;
  category: string;
  stock: number;
  photo: string | null;
}

export interface ChatReply {
  reply: string;
  products: ChatProduct[];
}

export const sendChat = (messages: ChatMessage[]) =>
  api.post<ChatReply>('/chat', { messages });
