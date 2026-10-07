import { errorMessage } from '../utils/error';
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import { getProducts } from '../services/products';
import type { Product } from '../types';
type Filters = {
  name: string;
  category: string;
  priceFrom: string;
  priceTo: string;
  isInStock: string;
  sort: string;
  page: number;
  take: number;
};

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    name: '',
    category: '',
    priceFrom: '',
    priceTo: '',
    isInStock: '',
    sort: '',
    page: 1,
    take: 12,
  });
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const load = async (f: Filters = filters) => {
    setLoading(true);
    setError('');
    try {
      const data = await getProducts(f);
      setProducts(data);
      setCategories((prev) =>
        [...new Set([...prev, ...data.map((x) => x.category)])].sort(),
      );
    } catch (e) {
      setError(errorMessage(e));
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, []);
  const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setFilters({ ...filters, [e.target.name]: e.target.value, page: 1 });
  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    load({ ...filters, page: 1 });
  };
  const goTo = (page: number) => {
    const next = { ...filters, page };
    setFilters(next);
    load(next);
  };
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">CATALOG</span>
          <h1>Products</h1>
        </div>
        <span className="muted">{products.length} shown</span>
      </div>
      <form className="filters" onSubmit={submit}>
        <input
          name="name"
          value={filters.name}
          onChange={change}
          placeholder="Search products"
        />
        <select name="category" value={filters.category} onChange={change}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          name="priceFrom"
          type="number"
          min="0"
          value={filters.priceFrom}
          onChange={change}
          placeholder="Min price"
        />
        <input
          name="priceTo"
          type="number"
          min="0"
          value={filters.priceTo}
          onChange={change}
          placeholder="Max price"
        />
        <select name="isInStock" value={filters.isInStock} onChange={change}>
          <option value="">Any stock</option>
          <option value="true">In stock</option>
          <option value="false">Out of stock</option>
        </select>
        <select name="sort" value={filters.sort} onChange={change}>
          <option value="">Sort</option>
          <option value="price">Price low to high</option>
          <option value="-price">Price high to low</option>
          <option value="date">Oldest</option>
          <option value="-date">Newest</option>
        </select>
        <button className="btn">Apply</button>
      </form>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <Loading />
      ) : (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
      {!loading && !products.length && !error && (
        <div className="empty">No products found.</div>
      )}
      <div className="row-actions">
        <button
          type="button"
          className="ghost"
          disabled={filters.page === 1 || loading}
          onClick={() => goTo(filters.page - 1)}
        >
          Previous
        </button>
        <span>Page {filters.page}</span>
        <button
          type="button"
          className="ghost"
          disabled={products.length < filters.take || loading}
          onClick={() => goTo(filters.page + 1)}
        >
          Next
        </button>
      </div>
    </section>
  );
}
