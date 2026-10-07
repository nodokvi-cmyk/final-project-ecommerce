import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProducts } from '../services/products';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import type { Product } from '../types';
export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    getProducts({ take: 8 })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <section className="hero">
        <div className="container hero-content">
          <div>
            <span className="eyebrow">EVERYDAY ESSENTIALS</span>
            <h1>Find something you'll love.</h1>
            <p>
              Browse quality products, add your favorites to the cart, and check
              out securely.
            </p>
            <Link to="/products" className="btn">
              Shop products
            </Link>
          </div>
          <div className="hero-card">
            <span>New arrivals</span>
            <strong>
              Fresh picks
              <br />
              for your day.
            </strong>
          </div>
        </div>
      </section>
      <section className="section container">
        <div className="section-head">
          <div>
            <span className="eyebrow">SHOP</span>
            <h2>Featured products</h2>
          </div>
          <Link to="/products" className="text-link">
            View all →
          </Link>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="product-grid">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </section>
      <section className="benefits">
        <div className="container benefits-grid">
          <div>
            <strong>Secure checkout</strong>
            <span>Powered by Stripe</span>
          </div>
          <div>
            <strong>Simple returns</strong>
            <span>Easy order management</span>
          </div>
          <div>
            <strong>Account control</strong>
            <span>Manage your profile</span>
          </div>
        </div>
      </section>
    </>
  );
}
