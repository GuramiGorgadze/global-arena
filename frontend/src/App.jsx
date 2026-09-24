import React from 'react';
import { ScrollToTopButton } from './components';
import './styles/style.scss';
import { Toaster } from 'react-hot-toast';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Navbar, Footer, Main } from './layouts';
import {
  Registration,
  Home,
  Marathon,
  CommitteeMatchPage,
  Admin,
  NotFoundPage,
  SessionCommandPage,
  Vote,
  VotingControl,
  VotingScreen,
} from './routes';
import useDocumentTitle from './hooks/useDocumentTitle';
import useScrollTop from './hooks/useScrollTop';

const APPLICATIONS_HOST = 'applications.g-arena.org';

// Routes that render on their own — no Navbar, no Footer, none of the
// site's content padding. A control surface, not a page. Add a path here
// and it gets the same treatment; nothing else changes.
const BARE_ROUTES = ['/command', '/vote', '/voting-control', '/voting-screen'];

function App() {
  useDocumentTitle();
  useScrollTop();

  // Reactive on purpose: isApplicationsSite reads window.location.hostname
  // directly because the hostname never changes mid-session, but pathname
  // does, every time someone navigates. Reading window.location.pathname
  // the same way would only be correct on a fresh page load — a client-side
  // navigation to /command wouldn't force App to re-render, so the chrome
  // could stay mounted a beat too long. useLocation() subscribes to the
  // router directly, so this updates the instant the route changes.
  const location = useLocation();
  const isApplicationsSite = window.location.hostname === APPLICATIONS_HOST;
  // isApplicationsSite always wins: that subdomain renders Registration
  // regardless of path, so "bare" only ever applies on the main site.
  const isBareRoute = !isApplicationsSite && BARE_ROUTES.includes(location.pathname);

  const routes = (
    <Routes>
      <Route
        path="/"
        element={<Home />}
      />
      <Route
        path="/register"
        element={<Registration />}
      />
      <Route
        path="/marathon"
        element={<Marathon />}
      />
      <Route
        path="/committee-match"
        element={<CommitteeMatchPage />}
      />
      <Route
        path="/vote"
        element={<Vote />}
      />
      <Route
        path="/voting-control"
        element={<VotingControl />}
      />
      <Route
        path="/voting-screen"
        element={<VotingScreen />}
      />
      <Route
        path="/command"
        element={<SessionCommandPage />}
      />
      <Route
        path="/admin-page-twvnlr4m8dqunb9kqdi6"
        element={<Admin />}
      />
      <Route
        path="*"
        element={<NotFoundPage />}
      />
    </Routes>
  );

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { textAlign: 'center' },
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
      {isBareRoute ? (
        routes
      ) : (
        <>
          <Navbar />
          <Main>
            <ScrollToTopButton />
            {isApplicationsSite ? <Registration /> : routes}
          </Main>
          <Footer />
        </>
      )}
    </>
  );
}

export default App;