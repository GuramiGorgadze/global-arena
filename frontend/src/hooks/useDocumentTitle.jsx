import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useDocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    switch (pathname) {
      case '/':
        document.title = 'Global Arena - GAMUN';
        break;

      case '/register':
        document.title = 'Global Arena - Registration';
        break;

      case '/marathon':
        document.title = 'Global Arena - Marathon';
        break;

      case '/committee-match':
        document.title = 'Global Arena - Committee Match';
        break;

      case '/admin-page-twvnlr4m8dqunb9kqdi6':
        document.title = 'Global Arena - Admin';
        break;

      default:
        document.title = 'Global Arena - Page Not Found';
        break;
    }
  }, [pathname]);
};

export default useDocumentTitle;
