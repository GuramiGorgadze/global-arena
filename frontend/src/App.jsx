import React from 'react';
import { Registration, ScrollToTopButton } from './components';
import './styles/style.scss';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import { Navbar, Footer, Main } from './layouts';
import { Home } from './routes';
import useDocumentTitle from './hooks/useDocumentTitle';
import useScrollTop from './hooks/useScrollTop';

const APPLICATIONS_HOST = 'applications.g-arena.org';

function App() {
  useDocumentTitle();
  useScrollTop();

  const isApplicationsSite = window.location.hostname === APPLICATIONS_HOST;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'customToast',
          duration: 4000,
          success: {
            iconTheme: {
              primary: 'var(--gold-bright)',
              secondary: 'var(--black-deep)',
            },
          },
          error: {
            iconTheme: {
              primary: 'var(--error-red)',
              secondary: 'var(--black-deep)',
            },
          },
          loading: {
            iconTheme: {
              primary: 'var(--gold-muted)',
              secondary: 'var(--black-deep)',
            },
          },
        }}
      />
      <Navbar />
      <Main>
        <ScrollToTopButton />
        {isApplicationsSite ? (
          <Registration />
        ) : (
          <Routes>
            <Route
              path="/"
              element={<Home />}
            />
            <Route
              path="*"
              element={<Registration />}
            />
          </Routes>
        )}
      </Main>
      <Footer />
    </>
  );
}

export default App;
