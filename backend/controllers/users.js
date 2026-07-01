import axios from "axios";
import Delegates from "../models/delegates.js";
import {
  sendDelegateConfirmationMail,
  sendAdminNotificationMail,
} from "../utils/mailSender.js";

const formatDateOnly = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const formatDateTime = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
};

const pushToGoogleSheets = async (delegate) => {
  const webhookUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("GOOGLE_SHEETS_WEBHOOK_URL is not set — skipping sheet sync.");
    return;
  }

  try {
    await axios.post(webhookUrl, {
      firstName: delegate.firstName,
      lastName: delegate.lastName,
      email: delegate.email,
      phone: delegate.phone,
      dob: formatDateOnly(delegate.dob),
      school: delegate.school,
      nationalId: delegate.nationalId,
      facebook: delegate.facebook,
      experience: delegate.experience,
      parentName: delegate.parentName,
      parentPhone: delegate.parentPhone,
      committee1: delegate.committees?.[0] || "",
      committee2: delegate.committees?.[1] || "",
      committee3: delegate.committees?.[2] || "",
      country1: delegate.countries?.[0] || "",
      country2: delegate.countries?.[1] || "",
      country3: delegate.countries?.[2] || "",
      createdAt: formatDateTime(delegate.createdAt),
    });
  } catch (err) {
    console.error("Failed to sync delegate to Google Sheets:", err.message);
  }
};

export const registerDelegate = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dob,
      school,
      nationalId,
      facebook,
      experience,
      parentName,
      parentPhone,
      committees,
      countries,
    } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !phone ||
      !dob ||
      !school ||
      !nationalId ||
      !facebook ||
      !experience ||
      !parentName ||
      !parentPhone ||
      !Array.isArray(committees) ||
      committees.length !== 3 ||
      !Array.isArray(countries) ||
      countries.length !== 3
    ) {
      return res
        .status(400)
        .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
    }

    const existing = await Delegates.findOne({
      $or: [{ email }, { nationalId }],
    });

    if (existing) {
      return res.status(409).json({
        message: "ამ ელ. ფოსტით ან პირადი ნომრით უკვე დარეგისტრირებული ხართ.",
      });
    }

    const delegate = await Delegates.create({
      firstName,
      lastName,
      email,
      phone,
      dob,
      school,
      nationalId,
      facebook,
      experience,
      parentName,
      parentPhone,
      committees,
      countries,
    });

    pushToGoogleSheets(delegate);

    Promise.allSettled([
      sendDelegateConfirmationMail(delegate),
      sendAdminNotificationMail(delegate),
    ]).then((results) => {
      results.forEach((r, i) => {
        if (r.status === "rejected") {
          console.error(
            i === 0
              ? "Delegate confirmation mail failed:"
              : "Admin notification mail failed:",
            r.reason,
          );
        }
      });
    });

    res.status(201).json({ delegate });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ err: err.message });
  }
};
