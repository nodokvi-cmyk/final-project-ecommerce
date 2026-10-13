interface Props {
  page: number;
  pageSize: number;
  // Items on the current page.
  count: number;
  // Items across all pages for the active filters.
  total: number;
  disabled?: boolean;
  onChange: (page: number) => void;
}

// Always the first page, the last page and three pages around the current
// one, e.g. 1 | 2 3 4 | 96, then 1 | 49 50 51 | 96, then 1 | 93 94 95 | 96.
// The first and last pages are drawn apart from the middle group, so they are
// returned separately. With four pages or fewer there is nothing to set apart.
interface PageGroups {
  first: number | null;
  middle: number[];
  last: number | null;
}

const buildPages = (page: number, lastPage: number): PageGroups => {
  if (lastPage <= 4) {
    const all = Array.from({ length: lastPage }, (_, i) => i + 1);
    return { first: null, middle: all, last: null };
  }
  const start = Math.min(Math.max(page - 1, 2), lastPage - 3);
  return {
    first: 1,
    middle: [start, start + 1, start + 2],
    last: lastPage,
  };
};

export default function Pagination({
  page,
  pageSize,
  count,
  total,
  disabled,
  onChange,
}: Props) {
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  if (lastPage <= 1) return null;
  const from = (page - 1) * pageSize + 1;
  const to = (page - 1) * pageSize + count;
  const go = (target: number) => {
    if (!disabled && target >= 1 && target <= lastPage) onChange(target);
  };
  const { first, middle, last } = buildPages(page, lastPage);
  const pageItem = (n: number, edge: boolean) => (
    <li key={n}>
      <button
        type="button"
        className={['page-num', edge ? 'edge' : '', n === page ? 'active' : '']
          .filter(Boolean)
          .join(' ')}
        disabled={disabled}
        aria-current={n === page ? 'page' : undefined}
        aria-label={
          edge ? `${n === 1 ? 'First' : 'Last'} page, ${n}` : `Page ${n}`
        }
        onClick={() => n !== page && go(n)}
      >
        {n}
      </button>
    </li>
  );

  return (
    <nav className="pagination" aria-label="Pagination">
      <span className="pagination-range">
        {count > 0 ? `Showing ${from}–${to} of ${total}` : `Page ${page}`}
      </span>
      <div className="pagination-controls">
        <button
          type="button"
          className="page-step"
          disabled={disabled || page <= 1}
          onClick={() => go(page - 1)}
          aria-label="Previous page"
        >
          <span aria-hidden="true">←</span>
          <span className="page-step-label">Previous</span>
        </button>
        <ul className="page-list">
          {first !== null && (
            <>
              {pageItem(first, true)}
              <li className="page-sep" aria-hidden="true" />
            </>
          )}
          {middle.map((n) => pageItem(n, false))}
          {last !== null && (
            <>
              <li className="page-sep" aria-hidden="true" />
              {pageItem(last, true)}
            </>
          )}
        </ul>
        <button
          type="button"
          className="page-step"
          disabled={disabled || page >= lastPage}
          onClick={() => go(page + 1)}
          aria-label="Next page"
        >
          <span className="page-step-label">Next</span>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </nav>
  );
}
