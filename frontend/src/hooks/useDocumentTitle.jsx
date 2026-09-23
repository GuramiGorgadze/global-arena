import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useDocumentTitle = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    switch (pathname) {
      case '/':
        document.title = 'Global Arena | GAMUN';
        break;

      case '/register':
        document.title = 'Global Arena | Registration';
        break;

      case '/marathon':
        document.title = 'Global Arena | Marathon';
        break;

      case '/committee-match':
        document.title = 'Global Arena | Committee Match';
        break;

      case '/admin-page-twvnlr4m8dqunb9kqdi6':
        document.title = 'Global Arena | Admin';
        break;

      case '/vote':
        document.title = 'Global Arena | Voting';
        break;

      case '/voting-control':
        document.title = 'Global Arena | Voting Control';
        break;

      case '/command':
        document.title = 'Global Arena | MUN Command';
        break;

      default:
        document.title = 'Global Arena | Page Not Found';
        break;
    }
  }, [pathname]);
};

export default useDocumentTitle;
