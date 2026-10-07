import { errorMessage } from '../utils/error';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getOrder } from '../services/orders';
import type { Order } from '../types';
export default function OrderDetails() {
  const { id = '' } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch((e) => setError(errorMessage(e)));
  }, [id]);
  if (error)
    return (
      <section className="section container">
        <Link to="/orders" className="back">
          ← Orders
        </Link>
        <div className="error">{error}</div>
      </section>
    );
  if (!order) return <div className="center">Loading...</div>;
  return (
    <section className="section container">
      <Link to="/orders" className="back">
        ← Orders
      </Link>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORDER</span>
          <h1>#{order._id.slice(-8)}</h1>
        </div>
        <span className={`status ${order.status}`}>{order.status}</span>
      </div>
      <div className="order-detail">
        <div className="form-card">
          <h2>Items</h2>
          {order.orderedItems.map((item, i) => (
            <div className="line-item" key={i}>
              <span>
                {item.quantity} × {item.name}
              </span>
              <strong>
                ${(Number(item.price) * item.quantity).toFixed(2)}
              </strong>
            </div>
          ))}
          <hr />
          <div className="line-item">
            <strong>Total</strong>
            <strong>${Number(order.totalAmount).toFixed(2)}</strong>
          </div>
        </div>
        <div className="form-card">
          <h2>Shipping</h2>
          <p>{order.shippingAddress}</p>
          <p className="muted">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}
