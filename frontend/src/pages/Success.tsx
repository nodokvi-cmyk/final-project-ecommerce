import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { confirmPayment } from '../services/payment';
import type { OrderStatus } from '../types';
export default function Success() {
  const { refreshCart } = useCart();
  const [params] = useSearchParams();
  const sessionId = params.get('session_id');
  const [status, setStatus] = useState<OrderStatus | null>(null);
  // Ask the server to confirm the payment with Stripe instead of waiting for
  // the webhook. Confirming is idempotent, so it is safe if both run.
  useEffect(() => {
    const run = async () => {
      try {
        if (sessionId) setStatus((await confirmPayment(sessionId)).status);
      } catch {
        // The webhook may still complete the order; the orders page shows it.
      }
      await refreshCart();
    };
    run();
  }, [sessionId]);
  const cancelled = status === 'cancelled';
  return (
    <section className="result">
      <div className="result-card">
        <span className="result-icon">{cancelled ? '×' : '✓'}</span>
        <h1>{cancelled ? 'Order cancelled' : 'Payment successful'}</h1>
        <p>
          {cancelled
            ? 'An item sold out while you were paying. Your payment is being refunded.'
            : 'Your order has been created and your payment is being processed.'}
        </p>
        <Link className="btn" to="/orders">
          View orders
        </Link>
      </div>
    </section>
  );
}
