import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

/** Закрывает drawer при смене маршрута; класс корня для стилей off-canvas сайдбара на мобильных. */
export function useDashboardNavDrawer() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname]);

  const rootClass =
    'app-dashboard-layout' + (navOpen ? ' app-dashboard-layout--nav-open' : '');

  return { navOpen, setNavOpen, rootClass };
}
