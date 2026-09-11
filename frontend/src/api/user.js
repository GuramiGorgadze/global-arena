import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const registerDelegate = async (data) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/users/delegate`, data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error registering delegate';
    throw new Error(msg);
  }
};
