import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useDocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    switch (pathname) {
      case '/':
        document.title = 'Global Arena - GAMUN';
        break;
      case '/Marathon':
        document.title = 'Global Arena - Marathon';
        break;
      default:
        document.title = 'Global Arena - Registration';
    }
  }, [pathname]);
};

export default useDocumentTitle;
