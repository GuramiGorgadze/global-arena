import { sendPaymentInfoMail } from "../utils/mailSender.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const sendPaymentEmails = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ message: "ელ. ფოსტების სია სავალდებულოა." });
    }

    const cleanEmails = [
      ...new Set(
        emails
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter(Boolean),
      ),
    ];

    const valid = cleanEmails.filter((e) => EMAIL_REGEX.test(e));
    const invalid = cleanEmails.filter((e) => !EMAIL_REGEX.test(e));

    const results = await Promise.allSettled(
      valid.map((email) => sendPaymentInfoMail(email)),
    );

    const sent = [];
    const failed = invalid.map((email) => ({
      email,
      error: "არასწორი ფორმატი",
    }));

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        sent.push(valid[i]);
      } else {
        failed.push({
          email: valid[i],
          error: r.reason?.message || "უცნობი შეცდომა",
        });
        console.error(`Failed to send payment email to ${valid[i]}:`, r.reason);
      }
    });

    res.status(200).json({ sent, failed });
  } catch (err) {
    console.error("sendPaymentEmails error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};
