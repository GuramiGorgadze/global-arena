import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const client = axios.create({
  baseURL: `${BASE_URL}/api/mun`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Every call throws a plain Error on failure, with the server's message
// where there is one and the HTTP status attached as err.status — the
// engine branches on 401 specifically (treat as signed out) versus
// anything else (a genuine error to show or retry).
function unwrap(promise, fallback) {
  return promise
    .then((response) => response.data)
    .catch((err) => {
      const status = err.response?.status;
      const message = err.response?.data?.message || fallback;
      const wrapped = new Error(message);
      wrapped.status = status;
      throw wrapped;
    });
}

export const listCommittees = () => unwrap(client.get('/committees'), 'Could not load committees.');

export const login = (committeeId, password) =>
  unwrap(client.post('/auth/login', { committeeId, password }), 'Could not sign in.');

export const logout = () => unwrap(client.post('/auth/logout'), 'Could not sign out.');

export const me = () => unwrap(client.get('/auth/me'), 'Not signed in.');

export const resetPassword = (committeeId, masterKey, newPassword) =>
  unwrap(
    client.post('/auth/reset-password', { committeeId, masterKey, newPassword }),
    'Could not reset the password.',
  );

export const getSession = () => unwrap(client.get('/session'), 'Could not load the session.');

export const saveSession = (session) =>
  unwrap(client.put('/session', { session }), 'Could not save the session.');

export const resetSession = () => unwrap(client.post('/session/reset'), 'Could not reset the session.');