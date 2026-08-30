import axios from "axios";

const BASE_URL = "/api/marathon";

export const getMarathonStatus = async (email) => {
  try {
    const response = await axios.get(`${BASE_URL}/status`, {
      params: email ? { email } : undefined,
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || "მარათონის სტატუსის ჩატვირთვა ვერ მოხერხდა";
    throw new Error(msg);
  }
};

export const getMarathonQuestions = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/questions`, {
      withCredentials: true,
    });
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || "კითხვების ჩატვირთვა ვერ მოხერხდა";
    throw new Error(msg);
  }
};

export const submitMarathonResult = async ({ email, answers }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/submit`,
      { email, answers },
      {
        headers: { "Content-Type": "application/json" },
        withCredentials: true,
      },
    );
    return response.data;
  } catch (err) {
    const msg = err.response?.data?.message || "პასუხების გაგზავნა ვერ მოხერხდა";
    throw new Error(msg);
  }
};