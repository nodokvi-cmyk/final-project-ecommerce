import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// React Router keeps the window scroll between routes, so opening a product
// from the middle of a long list would land mid-page. Start every new page at
// the top. It follows the path only, so filter and page changes on the same
// route are left alone, and back/forward (POP) keeps the browser's own scroll.
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (navigationType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
