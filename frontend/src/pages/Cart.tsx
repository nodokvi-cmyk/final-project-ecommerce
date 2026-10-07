import { errorMessage } from '../utils/error';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
export default function Cart() {
  const { cart, update, remove, clear } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const run = async (action: () => Promise<unknown>) => {
    setError('');
    try {
      await action();
    } catch (e) {
      setError(errorMessage(e));
    }
  };
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR BAG</span>
          <h1>Cart</h1>
        </div>
      </div>
      {error && <div className="error">{error}</div>}
      {!cart.items?.length ? (
        <div className="empty">
          <h2>Your cart is empty</h2>
          <Link className="btn" to="/products">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-list">
            {cart.items.map((item) => (
              <div className="cart-item" key={item._id}>
                <div className="cart-thumb">
                  {item.product?.photos?.[0] ? (
                    <img src={item.product.photos[0]} alt="" />
                  ) : (
                    <span>Product</span>
                  )}
                </div>
                <div className="cart-main">
                  <strong>{item.product?.productName || item.productId}</strong>
                  <span>${Number(item.price).toFixed(2)}</span>
                </div>
                <div className="quantity">
                  <button
                    onClick={() =>
                      run(() =>
                        update(item.productId, Math.max(1, item.quantity - 1)),
                      )
                    }
                  >
                    −
                  </button>
                  <span>{item.quantity}</span>
                  <button
                    onClick={() =>
                      run(() => update(item.productId, item.quantity + 1))
                    }
                  >
                    +
                  </button>
                </div>
                <button
                  className="remove"
                  onClick={() => run(() => remove(item.productId))}
                >
                  Remove
                </button>
              </div>
            ))}
            <button className="ghost" onClick={() => run(clear)}>
              Clear cart
            </button>
          </div>
          <aside className="summary">
            <h2>Summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>${Number(cart.totalPrice).toFixed(2)}</strong>
            </div>
            <button className="btn full" onClick={() => navigate('/checkout')}>
              Checkout
            </button>
          </aside>
        </div>
      )}
    </section>
  );
}
