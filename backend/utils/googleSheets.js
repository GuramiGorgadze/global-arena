import axios from "axios";
import { formatDateOnly, formatDateTime } from "./dateFormat.js";

const getWebhookUrl = () => process.env.GOOGLE_SHEETS_WEBHOOK_URL;

export const syncDelegateToSheets = async (delegate) => {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL is not set — skipping sheet sync.");
    return;
  }

  try {
    await axios.post(webhookUrl, {
      action: "registerDelegate",
      firstName: delegate.firstName,
      lastName: delegate.lastName,
      firstNameLatin: delegate.firstNameLatin,
      lastNameLatin: delegate.lastNameLatin,
      email: delegate.email,
      phone: delegate.phone,
      dob: formatDateOnly(delegate.dob),
      school: delegate.school,
      nationalId: delegate.nationalId,
      facebook: delegate.facebook,
      experience: delegate.experience,
      parentName: delegate.parentName || "",
      parentPhone: delegate.parentPhone || "",
      committee1: delegate.committees?.[0] || "",
      committee2: delegate.committees?.[1] || "",
      committee3: delegate.committees?.[2] || "",
      country1: delegate.countries?.[0] || "",
      country2: delegate.countries?.[1] || "",
      country3: delegate.countries?.[2] || "",
      promoCode: delegate.promoCode || "",
      createdAt: formatDateTime(delegate.createdAt),
    });
  } catch (err) {
    console.error("Failed to sync delegate to Google Sheets:", err.message);
  }
};

export const syncPaymentStatus = async (emails, field) => {
  if (!Array.isArray(emails) || emails.length === 0) return;

  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      "GOOGLE_SHEETS_WEBHOOK_URL is not set — skipping payment sheet sync.",
    );
    return;
  }

  try {
    await axios.post(webhookUrl, {
      action: "syncPaymentStatus",
      field,
      emails,
    });
  } catch (err) {
    console.error(
      `Failed to sync "${field}" status to Google Sheets:`,
      err.message,
    );
  }
};

export const syncPaymentRow = async ({
  firstName,
  lastName,
  email,
  phone,
  paymentSent,
  paid,
}) => {
  const webhookUrl = getWebhookUrl();
  if (!webhookUrl) {
    console.warn(
      "GOOGLE_SHEETS_WEBHOOK_URL is not set — skipping payment sheet sync.",
    );
    return;
  }

  try {
    await axios.post(webhookUrl, {
      action: "syncPaymentRow",
      firstName,
      lastName,
      email,
      phone,
      paymentSent: !!paymentSent,
      paid: !!paid,
    });
  } catch (err) {
    console.error(`Failed to sync payment row for ${email}:`, err.message);
  }
};
