import { Link } from 'react-router-dom';
export default function Cancel() {
  return (
    <section className="result">
      <div className="result-card">
        <span className="result-icon">×</span>
        <h1>Payment cancelled</h1>
        <p>
          Your payment was cancelled. Your order is still available in your
          account.
        </p>
        <Link className="btn" to="/cart">
          Return to cart
        </Link>
      </div>
    </section>
  );
}
