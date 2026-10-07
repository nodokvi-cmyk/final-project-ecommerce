import { errorMessage } from '../utils/error';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orders';
import type { Order } from '../types';
export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    getMyOrders()
      .then(setOrders)
      .catch((e) => setError(errorMessage(e)));
  }, []);
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ACCOUNT</span>
          <h1>My orders</h1>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {!orders.length ? (
        <div className="empty">No orders yet.</div>
      ) : (
        <div className="orders">
          {orders.map((o) => (
            <Link to={`/orders/${o._id}`} className="order-card" key={o._id}>
              <div>
                <strong>Order #{o._id.slice(-8)}</strong>
                <span>{new Date(o.createdAt).toLocaleDateString()}</span>
              </div>
              <div>
                <span className={`status ${o.status}`}>{o.status}</span>
                <strong>${Number(o.totalAmount).toFixed(2)}</strong>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
