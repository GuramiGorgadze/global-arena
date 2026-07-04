import * as yup from "yup";

const PHONE_REGEX = /^5\d{2}-\d{3}-\d{3}$/;
const LATIN_NAME_REGEX = /^[A-Za-z\s'-]+$/;
const GEORGIAN_NAME_REGEX = /^[\u10A0-\u10FF\s'-]+$/;
const FACEBOOK_REGEX = /^(https?:\/\/)?(www\.)?(facebook\.com|fb\.com)\/.+/i;

const MIN_AGE = 10;
const MAX_AGE = 30;

const MAX = {
  firstName: 20,
  lastName: 20,
  email: 30,
  firstNameLatin: 20,
  lastNameLatin: 20,
  school: 40,
  facebook: 150,
  experience: 400,
  country: 30,
  parentName: 40,
};

export const delegateSchema = yup.object({
  firstName: yup.string().trim().required().max(MAX.firstName).matches(GEORGIAN_NAME_REGEX),
  lastName: yup.string().trim().required().max(MAX.lastName).matches(GEORGIAN_NAME_REGEX),
  firstNameLatin: yup.string().trim().required().max(MAX.firstNameLatin).matches(LATIN_NAME_REGEX),
  lastNameLatin: yup.string().trim().required().max(MAX.lastNameLatin).matches(LATIN_NAME_REGEX),
  email: yup.string().trim().required().email().max(MAX.email),
  phone: yup.string().trim().required().matches(PHONE_REGEX),
  dob: yup
    .string()
    .required()
    .test("valid-date", "invalid date", (v) => v && !Number.isNaN(new Date(v).getTime()))
    .test("age-range", "age out of range", (v) => {
      if (!v) return false;
      const dob = new Date(v);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const hadBirthday =
        today.getMonth() > dob.getMonth() ||
        (today.getMonth() === dob.getMonth() && today.getDate() >= dob.getDate());
      if (!hadBirthday) age -= 1;
      return age >= MIN_AGE && age <= MAX_AGE;
    }),
  nationalId: yup.string().trim().required().matches(/^\d{11}$/),
  parentName: yup.string().trim().required().max(MAX.parentName),
  parentPhone: yup.string().trim().required().matches(PHONE_REGEX),
  school: yup.string().trim().required().max(MAX.school),
  facebook: yup.string().trim().required().max(MAX.facebook).matches(FACEBOOK_REGEX),
  experience: yup.string().trim().required().max(MAX.experience),
  committees: yup
    .array()
    .of(yup.string().required())
    .length(3)
    .test("unique", "duplicate committees", (arr) => {
      const filled = (arr || []).filter(Boolean);
      return new Set(filled).size === filled.length;
    }),
  countries: yup
    .array()
    .of(yup.string().trim().required().max(MAX.country))
    .length(3)
    .test("unique", "duplicate countries", (arr) => {
      const filled = (arr || []).map((c) => (c || "").trim().toLowerCase()).filter(Boolean);
      return new Set(filled).size === filled.length;
    }),
});