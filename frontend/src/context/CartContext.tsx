import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../services/cart';
import { getProduct } from '../services/products';
import { useAuth } from './AuthContext';
import type { Cart } from '../types';

interface CartContextValue {
  cart: Cart;
  count: number;
  refreshCart: () => Promise<void>;
  add: (id: string, quantity?: number) => Promise<Cart>;
  update: (id: string, quantity: number) => Promise<Cart>;
  remove: (id: string) => Promise<Cart>;
  clear: () => Promise<Cart>;
}

const CartContext = createContext<CartContextValue | null>(null);

async function enrich(cart: Cart): Promise<Cart> {
  const items = await Promise.all(
    (cart.items || []).map(async (item) => {
      try {
        const product = await getProduct(item.productId);
        return { ...item, product };
      } catch {
        return item;
      }
    }),
  );
  return { ...cart, items };
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart>({ items: [], totalPrice: 0 });
  const refreshCart = async () => {
    if (!user) {
      setCart({ items: [], totalPrice: 0 });
      return;
    }
    try {
      setCart(await enrich(await getCart()));
    } catch {}
  };
  useEffect(() => {
    refreshCart();
  }, [user]);
  const add = async (id: string, quantity = 1) => {
    const result = await addToCart(id, quantity);
    const full = await enrich(result);
    setCart(full);
    return full;
  };
  const update = async (id: string, quantity: number) => {
    const result = await updateCartItem(id, quantity);
    const full = await enrich(result);
    setCart(full);
    return full;
  };
  const remove = async (id: string) => {
    const result = await removeCartItem(id);
    const full = await enrich(result);
    setCart(full);
    return full;
  };
  const clear = async () => {
    const result = await clearCart();
    setCart(result);
    return result;
  };
  const count = cart.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  return (
    <CartContext.Provider
      value={{ cart, count, refreshCart, add, update, remove, clear }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
};
