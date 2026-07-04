import axios from 'axios';

export const registerDelegate = async (data) => {
  try {
    const response = await axios.post('http://localhost:3000/api/users/delegate', JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    throw new Error(err.response?.data?.err || 'Error registering delegate');
  }
};
