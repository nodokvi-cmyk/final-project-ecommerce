import { errorMessage } from '../utils/error';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../services/orders';
import { createCheckout } from '../services/payment';
export default function Checkout() {
  const { cart } = useCart();
  const navigate = useNavigate();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const order = await createOrder({
        shippingAddress: address,
        orderedItems: cart.items.map((item) => ({
          productId: item.productId,
          name: item.product?.productName || 'Product',
          price: Number(item.price),
          quantity: item.quantity,
        })),
      });
      const payment = await createCheckout({
        orderId: order._id,
        items: order.orderedItems.map((i) => ({
          name: i.name,
          price: i.price,
          quantity: i.quantity,
        })),
        currency: 'usd',
      });
      window.location.href = payment.url;
    } catch (e) {
      setError(errorMessage(e));
      setLoading(false);
    }
  };
  if (!cart.items?.length)
    return (
      <section className="section container">
        <div className="empty">
          <h2>Your cart is empty</h2>
          <button className="btn" onClick={() => navigate('/products')}>
            Shop now
          </button>
        </div>
      </section>
    );
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CHECKOUT</span>
          <h1>Complete your order</h1>
        </div>
      </div>
      <div className="checkout-layout">
        <form className="form-card" onSubmit={submit}>
          {error && <div className="error">{error}</div>}
          <label>
            Shipping address
            <textarea
              required
              rows={6}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, city, country"
            />
          </label>
          <button disabled={loading} className="btn full">
            {loading ? 'Creating checkout...' : 'Pay securely with Stripe'}
          </button>
        </form>
        <aside className="summary">
          <h2>Order summary</h2>
          {cart.items.map((i) => (
            <div key={i._id}>
              <span>
                {i.quantity} × {i.product?.productName || 'Product'}
              </span>
              <strong>${(Number(i.price) * i.quantity).toFixed(2)}</strong>
            </div>
          ))}
          <hr />
          <div>
            <span>Total</span>
            <strong>${Number(cart.totalPrice).toFixed(2)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}
