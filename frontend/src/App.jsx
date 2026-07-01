import React from 'react';
import { Registration, ScrollToTopButton } from './components';
import './styles/style.scss';
import { Toaster } from 'react-hot-toast';
import { Routes, Route } from 'react-router-dom';
import useDocumentTitle from './hooks/useDocumentTitle';
import useScrollTop from './hooks/useScrollTop';

function App() {
  useDocumentTitle();
  useScrollTop();

  return (
    <div>
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

      <ScrollToTopButton />
      <Routes>
        <Route
          path="/"
          element={<Registration />}
        />
      </Routes>
    </div>
  );
}

export default App;
