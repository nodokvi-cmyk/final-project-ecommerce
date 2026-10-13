import { errorMessage } from '../utils/error';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import WishlistButton from './WishlistButton';
import { isLowStock } from '../utils/stock';
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
  const low = isLowStock(product.stock);
  return (
    <article className="product-card">
      <WishlistButton productId={product._id} />
      <Link to={`/products/${product._id}`} className="product-image">
        {image ? (
          <img src={image} alt={product.productName} />
        ) : (
          <span>No image</span>
        )}
        {low && <span className="low-stock-badge">Almost gone</span>}
      </Link>
      <div className="product-info">
        <div className="muted">{product.category}</div>
        <Link to={`/products/${product._id}`}>
          <h3>{product.productName}</h3>
        </Link>
        <div className="product-row">
          <strong>${Number(product.price).toFixed(2)}</strong>
          <span
            className={
              product.stock <= 0 ? 'out' : low ? 'stock low-stock' : 'stock'
            }
          >
            {product.stock <= 0
              ? 'Out of stock'
              : low
                ? `Only ${product.stock} left`
                : `${product.stock} left`}
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
