import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import { getWishlist } from '../services/wishlist';
import { useWishlist } from '../context/WishlistContext';
import { errorMessage } from '../utils/error';
import type { Product } from '../types';

export default function Wishlist() {
  const { has, loaded } = useWishlist();
  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    getWishlist()
      .then(setItems)
      .catch((e) => setError(errorMessage(e)))
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <Loading />;
  const visible = loaded ? items.filter((p) => has(p._id)) : items;
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>My wishlist</h1>
        </div>
        <span className="muted">{visible.length} saved</span>
      </div>
      {error && <div className="error">{error}</div>}
      {!visible.length && !error ? (
        <div className="empty">
          Your wishlist is empty. <Link to="/products">Browse products</Link>
        </div>
      ) : (
        <div className="product-grid">
          {visible.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </section>
  );
}
