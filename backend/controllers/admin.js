import {
  sendPaymentInfoMail,
  sendPaymentConfirmedMail,
} from "../utils/mailSender.js";
import SentEmail from "../models/SentEmails.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const saveSentEmails = async (emails, type) => {
  if (emails.length === 0) return;

  const ops = emails.map((email) => ({
    updateOne: {
      filter: { email, type },
      update: { $setOnInsert: { email, type, sentAt: new Date() } },
      upsert: true,
    },
  }));

  try {
    await SentEmail.bulkWrite(ops, { ordered: false });
  } catch (err) {
    console.error(`Failed to save sent "${type}" emails:`, err);
  }
};

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

    await saveSentEmails(sent, "payment");

    res.status(200).json({ sent, failed });
  } catch (err) {
    console.error("sendPaymentEmails error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

export const sendConfirmationEmails = async (req, res) => {
  try {
    const { emails } = req.body;

    if (!Array.isArray(emails) || emails.length === 0) {
      return res
        .status(400)
        .json({ message: "აირჩიეთ მინიმუმ ერთი ადრესატი." });
    }

    const [paymentSentDocs, alreadyConfirmedDocs] = await Promise.all([
      SentEmail.find({ type: "payment" }, "email").lean(),
      SentEmail.find({ type: "confirmation" }, "email").lean(),
    ]);

    const paymentSentSet = new Set(paymentSentDocs.map((d) => d.email));
    const alreadyConfirmedSet = new Set(
      alreadyConfirmedDocs.map((d) => d.email),
    );

    const candidates = [
      ...new Set(
        emails
          .map((e) => (typeof e === "string" ? e.trim().toLowerCase() : ""))
          .filter(Boolean),
      ),
    ];

    const eligible = [];
    const failed = [];

    candidates.forEach((email) => {
      if (!EMAIL_REGEX.test(email)) {
        failed.push({ email, error: "არასწორი ფორმატი" });
      } else if (!paymentSentSet.has(email)) {
        failed.push({ email, error: "გადახდის მეილი არ გაგზავნილა" });
      } else if (alreadyConfirmedSet.has(email)) {
        failed.push({ email, error: "დადასტურების მეილი უკვე გაგზავნილია" });
      } else {
        eligible.push(email);
      }
    });

    const results = await Promise.allSettled(
      eligible.map((email) => sendPaymentConfirmedMail(email)),
    );

    const sent = [];

    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        sent.push(eligible[i]);
      } else {
        failed.push({
          email: eligible[i],
          error: r.reason?.message || "უცნობი შეცდომა",
        });
        console.error(
          `Failed to send confirmation email to ${eligible[i]}:`,
          r.reason,
        );
      }
    });

    await saveSentEmails(sent, "confirmation");

    res.status(200).json({ sent, failed });
  } catch (err) {
    console.error("sendConfirmationEmails error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};

export const getSentEmails = async (req, res) => {
  try {
    const [paymentDocs, confirmationDocs] = await Promise.all([
      SentEmail.find({ type: "payment" }).sort({ sentAt: -1 }).lean(),
      SentEmail.find({ type: "confirmation" }).sort({ sentAt: -1 }).lean(),
    ]);

    res.status(200).json({
      payment: paymentDocs.map((d) => ({ email: d.email, sentAt: d.sentAt })),
      confirmation: confirmationDocs.map((d) => ({
        email: d.email,
        sentAt: d.sentAt,
      })),
    });
  } catch (err) {
    console.error("getSentEmails error:", err);
    res.status(500).json({ message: "სერვერზე მოხდა შეცდომა." });
  }
};
