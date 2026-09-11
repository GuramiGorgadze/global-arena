import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const sendPaymentEmails = async (emails) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/admin/send-payment-emails`,
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
