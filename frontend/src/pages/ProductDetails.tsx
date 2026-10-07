import { errorMessage } from '../utils/error';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getProduct } from '../services/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/Loading';
import WishlistButton from '../components/WishlistButton';
import type { Product } from '../types';
export default function ProductDetails() {
  const { id = '' } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [selected, setSelected] = useState(0);
  const [qty, setQty] = useState(1);
  const [message, setMessage] = useState('');
  const [loadError, setLoadError] = useState('');
  const { add } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    setProduct(null);
    setSelected(0);
    setQty(1);
    getProduct(id)
      .then(setProduct)
      .catch((e) => setLoadError(errorMessage(e)));
  }, [id]);
  if (loadError)
    return (
      <section className="section container">
        <Link to="/products" className="back">
          ← Back to products
        </Link>
        <div className="error">{loadError}</div>
      </section>
    );
  if (!product) return <Loading />;
  const addItem = async () => {
    if (!user) {
      navigate('/login', { state: { from: `/products/${id}` } });
      return;
    }
    try {
      await add(product._id, qty);
      setMessage('Added to cart');
    } catch (e) {
      setMessage(errorMessage(e));
    }
  };
  return (
    <section className="section container">
      <Link to="/products" className="back">
        ← Back to products
      </Link>
      <div className="details">
        <div className="gallery">
          <div className="main-photo">
            {product.photos?.length ? (
              <img src={product.photos[selected]} alt={product.productName} />
            ) : (
              <span>No image</span>
            )}
          </div>
          <div className="thumbs">
            {product.photos?.map((photo, i) => (
              <button
                key={photo}
                className={selected === i ? 'active' : ''}
                onClick={() => setSelected(i)}
              >
                <img src={photo} alt="" />
              </button>
            ))}
          </div>
        </div>
        <div className="details-copy">
          <span className="eyebrow">{product.category}</span>
          <h1>{product.productName}</h1>
          <div className="price large">${Number(product.price).toFixed(2)}</div>
          <p>{product.description}</p>
          <div className="stock-line">
            {product.stock > 0 ? `${product.stock} available` : 'Out of stock'}
          </div>
          <div className="buy-row">
            <div className="quantity">
              <button onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty(Math.min(product.stock, qty + 1))}>
                +
              </button>
            </div>
            <button className="btn" disabled={!product.stock} onClick={addItem}>
              Add to cart
            </button>
            <WishlistButton productId={product._id} inline />
          </div>
          {message && <div className="notice">{message}</div>}
        </div>
      </div>
    </section>
  );
}
