import { errorMessage } from '../../utils/error';
import { useEffect, useState } from 'react';
import { deleteOrder, getAllOrders, updateOrder } from '../../services/orders';
import type { Order, OrderStatus } from '../../types';
const statuses: OrderStatus[] = [
  'pending',
  'paid',
  'shipped',
  'delivered',
  'cancelled',
];
export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState('');
  const load = () =>
    getAllOrders()
      .then(setOrders)
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, []);
  const status = async (id: string, value: OrderStatus) => {
    setError('');
    try {
      await updateOrder(id, { status: value });
      await load();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  const remove = async (id: string) => {
    if (confirm('Delete this order?')) {
      setError('');
      try {
        await deleteOrder(id);
        await load();
      } catch (e) {
        setError(errorMessage(e));
      }
    }
  };
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Orders</h1>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="admin-table">
        {orders.map((o) => (
          <div className="admin-row order-admin" key={o._id}>
            <div>
              <strong>#{o._id.slice(-8)}</strong>
              <small>{new Date(o.createdAt).toLocaleString()}</small>
            </div>
            <span>${Number(o.totalAmount).toFixed(2)}</span>
            <select
              value={o.status}
              onChange={(e) => status(o._id, e.target.value as OrderStatus)}
            >
              {statuses.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <button className="danger small" onClick={() => remove(o._id)}>
              Delete
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
