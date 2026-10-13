import { errorMessage } from '../utils/error';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Loading from '../components/Loading';
import Pagination from '../components/Pagination';
import Benefits from '../components/Benefits';
import {
  getCategories,
  getProductCount,
  getProducts,
} from '../services/products';
import type { Product } from '../types';

const TAKE = 12;
const DEBOUNCE_MS = 200;
const FIELDS = [
  'name',
  'category',
  'priceFrom',
  'priceTo',
  'isInStock',
  'sort',
] as const;
type Field = (typeof FIELDS)[number];
type Fields = Record<Field, string>;

// The URL query string is the single source of truth for the active filters.
const readFields = (p: URLSearchParams): Fields => ({
  name: p.get('name') ?? '',
  category: p.get('category') ?? '',
  priceFrom: p.get('priceFrom') ?? '',
  priceTo: p.get('priceTo') ?? '',
  isInStock: p.get('isInStock') ?? '',
  sort: p.get('sort') ?? '',
});

const readPage = (p: URLSearchParams): number => {
  const page = Number(p.get('page'));
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const sameFields = (a: Fields, b: Fields) => FIELDS.every((k) => a[k] === b[k]);

export default function Products() {
  const [params, setParams] = useSearchParams();
  const paramsKey = params.toString();
  const filterKey = JSON.stringify(readFields(params));
  const page = readPage(params);
  // Inputs edit local state so typing stays instant; it reaches the URL (and
  // therefore the request) after the debounce below.
  const [form, setForm] = useState<Fields>(() => readFields(params));
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<string[]>([]);
  const [error, setError] = useState('');
  const paramsRef = useRef(params);
  paramsRef.current = params;

  // Form -> URL, 200ms after the last change. Changing a filter resets the page.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (sameFields(readFields(paramsRef.current), form)) return;
      const next = new URLSearchParams();
      FIELDS.forEach((k) => {
        if (form[k]) next.set(k, form[k]);
      });
      setParams(next, { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [form, setParams]);

  // URL -> form, for back/forward and links that arrive with filters set.
  useEffect(() => {
    const fromUrl = readFields(new URLSearchParams(paramsKey));
    setForm((current) => (sameFields(current, fromUrl) ? current : fromUrl));
  }, [paramsKey]);

  // Fetch whenever the URL changes. A stale response must not overwrite a
  // newer one.
  useEffect(() => {
    let cancelled = false;
    const current = new URLSearchParams(paramsKey);
    setLoading(true);
    setError('');
    getProducts({ ...readFields(current), page: readPage(current), take: TAKE })
      .then((data) => {
        if (cancelled) return;
        setProducts(data);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(errorMessage(e));
        setProducts([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [paramsKey]);

  // The total depends on the filters only, so paging does not refetch it.
  useEffect(() => {
    let cancelled = false;
    getProductCount(readFields(new URLSearchParams(paramsKey)))
      .then((r) => {
        if (!cancelled) setTotal(r.total);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  // The dropdown lists every category, not just those on the current page.
  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const change = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });
  const goTo = (target: number) => {
    const next = new URLSearchParams(params);
    if (target > 1) next.set('page', String(target));
    else next.delete('page');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const pager = (
    <Pagination
      page={page}
      pageSize={TAKE}
      count={products.length}
      total={total}
      disabled={loading}
      onChange={goTo}
    />
  );
  const categoryOptions =
    form.category && !categories.includes(form.category)
      ? [...categories, form.category].sort()
      : categories;

  return (
    <>
      <section className="section container">
        <div className="page-heading">
          <div>
            <span className="eyebrow">CATALOG</span>
            <h1>Products</h1>
          </div>
          <span className="muted">{products.length} shown</span>
        </div>
        <form
          className="filters"
          onSubmit={(e: FormEvent<HTMLFormElement>) => e.preventDefault()}
        >
          <input
            name="name"
            value={form.name}
            onChange={change}
            placeholder="Search products"
          />
          <select name="category" value={form.category} onChange={change}>
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <input
            name="priceFrom"
            type="number"
            min="0"
            value={form.priceFrom}
            onChange={change}
            placeholder="Min price"
          />
          <input
            name="priceTo"
            type="number"
            min="0"
            value={form.priceTo}
            onChange={change}
            placeholder="Max price"
          />
          <select name="isInStock" value={form.isInStock} onChange={change}>
            <option value="">Any stock</option>
            <option value="true">In stock</option>
            <option value="false">Out of stock</option>
          </select>
          <select name="sort" value={form.sort} onChange={change}>
            <option value="">Sort</option>
            <option value="price">Price low to high</option>
            <option value="-price">Price high to low</option>
            <option value="date">Oldest</option>
            <option value="-date">Newest</option>
          </select>
        </form>
        {error && <div className="error">{error}</div>}
        {pager}
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
        {pager}
      </section>
      <Benefits />
    </>
  );
}
