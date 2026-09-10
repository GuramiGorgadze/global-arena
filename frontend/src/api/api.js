import axios from 'axios';

export const registerDelegate = async (data) => {
  try {
    const response = await axios.post('/api/users/delegate', data, {
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error registering delegate';
    throw new Error(msg);
  }
};

export const sendPaymentEmails = async (emails) => {
  try {
    const response = await axios.post(
      '/api/admin/send-payment-emails',
      { emails },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error sending payment emails';
    throw new Error(msg);
  }
};
