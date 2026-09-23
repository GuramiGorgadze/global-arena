import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getMarathonStatus = async (email) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/marathon/status`, {
      params: email ? { email } : undefined,
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'მარათონის სტატუსის ჩატვირთვა ვერ მოხერხდა';
    throw new Error(msg);
  }
};

export const getMarathonQuestions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/marathon/questions`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'კითხვების ჩატვირთვა ვერ მოხერხდა';
    throw new Error(msg);
  }
};

export const submitMarathonResult = async (payload) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/marathon/submit`, payload, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'პასუხების გაგზავნა ვერ მოხერხდა';
    throw new Error(msg);
  }
};
