import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Scroll the window
    window.scrollTo({ top: 0, behavior: 'instant' });
    // Also scroll document body and html element directly
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    // Scroll any element with class 'app' (your root div)
    const appEl = document.querySelector('.app');
    if (appEl) appEl.scrollTop = 0;
  }, [pathname, search]);

  return null;
};

export default ScrollToTop;