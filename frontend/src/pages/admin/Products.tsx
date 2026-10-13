import { errorMessage } from '../../utils/error';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  deleteProduct,
  getProductCount,
  getProducts,
} from '../../services/products';
import Pagination from '../../components/Pagination';
import type { Product } from '../../types';
export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [error, setError] = useState('');
  const [total, setTotal] = useState(0);
  const take = 30;
  const load = (p = page) =>
    Promise.all([getProducts({ take, page: p }), getProductCount()])
      .then(([items, count]) => {
        setProducts(items);
        setTotal(count.total);
      })
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load(page);
  }, [page]);
  const remove = async (id: string) => {
    if (confirm('Delete this product?')) {
      try {
        await deleteProduct(id);
        await load(page);
      } catch (e) {
        setError(errorMessage(e));
      }
    }
  };
  const pager = (
    <Pagination
      page={page}
      pageSize={take}
      count={products.length}
      total={total}
      onChange={(next) => {
        setPage(next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }}
    />
  );
  return (
    <section className="section container">
      <div className="page-heading">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Products</h1>
        </div>
        <Link className="btn" to="/admin/products/new">
          Add product
        </Link>
      </div>
      {error && <div className="error">{error}</div>}
      {pager}
      <div className="admin-table">
        {products.map((p) => (
          <div className="admin-row" key={p._id}>
            <div className="table-product">
              {p.photos?.[0] ? <img src={p.photos[0]} alt="" /> : <span />}
              <div>
                <strong>{p.productName}</strong>
                <small>{p.category}</small>
              </div>
            </div>
            <span>${Number(p.price).toFixed(2)}</span>
            <span>{p.stock}</span>
            <div className="row-actions">
              <Link className="ghost" to={`/admin/products/${p._id}/edit`}>
                Edit
              </Link>
              <button className="danger small" onClick={() => remove(p._id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
      {pager}
    </section>
  );
}
