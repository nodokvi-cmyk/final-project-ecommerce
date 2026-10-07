import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
export default function Success() {
  const { clear } = useCart();
  useEffect(() => {
    clear().catch(() => {});
  }, []);
  return (
    <section className="result">
      <div className="result-card">
        <span className="result-icon">✓</span>
        <h1>Payment successful</h1>
        <p>Your order has been created and your payment is being processed.</p>
        <Link className="btn" to="/orders">
          View orders
        </Link>
      </div>
    </section>
  );
}
