import { Link } from 'react-router-dom';
import { useGuardedLink } from '../utils/useGuardedLink';

export default function Benefits() {
  const guarded = useGuardedLink();
  return (
    <section className="benefits">
      <div className="container benefits-grid">
        <div>
          <strong>Secure checkout</strong>
          <a
            href="https://stripe.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            Powered by Stripe
          </a>
        </div>
        <div>
          <strong>Simple returns</strong>
          <Link {...guarded('/orders')}>Easy order management</Link>
        </div>
        <div>
          <strong>Account control</strong>
          <Link {...guarded('/profile')}>Manage your profile</Link>
        </div>
      </div>
    </section>
  );
}
