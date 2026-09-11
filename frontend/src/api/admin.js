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

export const sendConfirmationEmails = async (emails) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/admin/send-confirmation-emails`,
      { emails },
      {
        headers: { 'Content-Type': 'application/json' },
        withCredentials: true,
      }
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error sending confirmation emails';
    throw new Error(msg);
  }
};

export const getSentEmails = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/admin/sent-emails`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || 'Error fetching sent emails';
    throw new Error(msg);
  }
};
