import { errorMessage } from '../utils/error';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import type { Product } from '../types';
export default function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const addItem = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/products' } });
      return;
    }
    setError('');
    try {
      await add(product._id, 1);
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const image = product.photos?.[0];
  return (
    <article className="product-card">
      <WishlistButton productId={product._id} />
      <Link to={`/products/${product._id}`} className="product-image">
        {image ? (
          <img src={image} alt={product.productName} />
        ) : (
          <span>No image</span>
        )}
      </Link>
      <div className="product-info">
        <div className="muted">{product.category}</div>
        <Link to={`/products/${product._id}`}>
          <h3>{product.productName}</h3>
        </Link>
        <div className="product-row">
          <strong>${Number(product.price).toFixed(2)}</strong>
          <span className={product.stock > 0 ? 'stock' : 'out'}>
            {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
          </span>
        </div>
        <button
          disabled={!product.stock}
          className="btn full"
          onClick={addItem}
        >
          Add to cart
        </button>
        {error && <div className="error">{error}</div>}
      </div>
    </article>
  );
}
