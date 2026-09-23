import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const post = async (path, data, fallback) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/voting${path}`, data, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || fallback);
  }
};

export const getVotingState = (email) => post('/state', { email }, 'ჩატვირთვა ვერ მოხერხდა');

export const castVote = (email, resolutionId, choice) =>
  post('/vote', { email, resolutionId, choice }, 'ხმის გაგზავნა ვერ მოხერხდა');

// --- Chair controls --------------------------------------------------------
// These hit the /admin/* endpoints, which are guarded server-side by
// requireChairKey. The key is supplied per call rather than baked into a
// shared axios instance, since the panel itself owns when it's "unlocked".

const adminGet = async (path, chairKey, fallback) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/voting${path}`, {
      withCredentials: true,
      headers: { 'x-chair-key': chairKey },
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || fallback);
  }
};

const adminPost = async (path, chairKey, data, fallback) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/voting${path}`, data, {
      withCredentials: true,
      headers: { 'x-chair-key': chairKey },
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.message || fallback);
  }
};

export const getAdminVotingState = (chairKey) =>
  adminGet('/admin/state', chairKey, 'სტატუსის ჩატვირთვა ვერ მოხერხდა');

export const openVoting = (chairKey, { title, committee, eligibleCount }) =>
  adminPost(
    '/admin/open',
    chairKey,
    { title, committee, eligibleCount },
    'კენჭისყრის გახსნა ვერ მოხერხდა'
  );

export const closeVoting = (chairKey) =>
  adminPost('/admin/close', chairKey, {}, 'კენჭისყრის დახურვა ვერ მოხერხდა');
