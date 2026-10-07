import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import {
  addToWishlist,
  getWishlist,
  removeFromWishlist,
} from '../services/wishlist';
import { useAuth } from './AuthContext';

interface WishlistContextValue {
  ids: string[];
  count: number;
  loaded: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [ids, setIds] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    let active = true;
    setLoaded(false);
    if (!user) {
      setIds([]);
      return;
    }
    getWishlist()
      .then((items) => {
        if (active) setIds(items.map((item) => item._id));
      })
      .catch(() => {
        if (active) setIds([]);
      })
      .finally(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [user]);
  const has = (id: string) => ids.includes(id);
  const toggle = async (id: string) => {
    const result = has(id)
      ? await removeFromWishlist(id)
      : await addToWishlist(id);
    setIds(result.map(String));
  };
  return (
    <WishlistContext.Provider
      value={{ ids, count: ids.length, loaded, has, toggle }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context)
    throw new Error('useWishlist must be used inside WishlistProvider');
  return context;
};
