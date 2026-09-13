import Delegates from "../models/delegates.js";
import {
  sendDelegateConfirmationMail,
  sendAdminNotificationMail,
} from "../utils/mailSender.js";
import { syncDelegateToSheets } from "../utils/googleSheets.js";

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

    syncDelegateToSheets(delegate);

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