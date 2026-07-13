import axios from "axios";
import Delegates from "../models/delegates.js";
import {
  sendDelegateConfirmationMail,
  sendAdminNotificationMail,
} from "../utils/mailSender.js";
import { formatDateOnly, formatDateTime } from "../utils/dateFormat.js";

const MINOR_AGE_THRESHOLD = 18;

const isMinor = (dobValue) => {
  const dob = new Date(dobValue);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dob.getMonth() ||
    (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age < MINOR_AGE_THRESHOLD;
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

export const registerDelegate = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      firstNameLatin,
      lastNameLatin,
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
      promoCode,
    } = req.body;

    const stringFields = {
      firstName,
      lastName,
      firstNameLatin,
      lastNameLatin,
      email,
      phone,
      school,
      nationalId,
      facebook,
      experience,
    };
    for (const [key, value] of Object.entries(stringFields)) {
      if (typeof value !== "string") {
        return res
          .status(400)
          .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
      }
    }

    if (parentName !== undefined && typeof parentName !== "string") {
      return res
        .status(400)
        .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
    }

    if (parentPhone !== undefined && typeof parentPhone !== "string") {
      return res
        .status(400)
        .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
    }

    if (promoCode !== undefined && typeof promoCode !== "string") {
      return res
        .status(400)
        .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
    }

    if (
      !firstName ||
      !lastName ||
      !firstNameLatin ||
      !lastNameLatin ||
      !email ||
      !phone ||
      !dob ||
      !school ||
      !nationalId ||
      !facebook ||
      !experience ||
      !Array.isArray(committees) ||
      committees.length !== 3 ||
      !committees.every((c) => typeof c === "string") ||
      !Array.isArray(countries) ||
      countries.length !== 3 ||
      !countries.every((c) => typeof c === "string")
    ) {
      return res
        .status(400)
        .json({ message: "ყველა სავალდებულო ველი უნდა იყოს შევსებული." });
    }

    const minor = isMinor(dob);
    if (minor && (!parentName || !parentPhone)) {
      return res.status(400).json({
        message: "მშობლის ინფორმაცია სავალდებულოა 18 წლამდე ასაკის დელეგატებისთვის.",
      });
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
      firstNameLatin,
      lastNameLatin,
      email,
      phone,
      dob,
      school,
      nationalId,
      facebook,
      experience,
      parentName: parentName?.trim() || undefined,
      parentPhone: parentPhone?.trim() || undefined,
      committees,
      countries,
      promoCode: promoCode?.trim() || undefined,
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
    console.error("registerDelegate error:", err);
    res.status(500).json({
      message: "სერვერზე მოხდა შეცდომა. სცადეთ ხელახლა მოგვიანებით.",
    });
  }
};