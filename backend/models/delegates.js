import mongoose from "mongoose";

const { Schema } = mongoose;

const MINOR_AGE_THRESHOLD = 18;

const isMinorDob = function (dobValue) {
  const dob = dobValue || this.dob;
  if (!dob) return false;
  const dobDate = new Date(dob);
  if (Number.isNaN(dobDate.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dobDate.getFullYear();
  const hasHadBirthdayThisYear =
    today.getMonth() > dobDate.getMonth() ||
    (today.getMonth() === dobDate.getMonth() && today.getDate() >= dobDate.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age < MINOR_AGE_THRESHOLD;
};

const delegateSchema = new Schema(
  {
    firstName: { type: String, required: true, trim: true, maxlength: 20 },
    lastName: { type: String, required: true, trim: true, maxlength: 20 },
    firstNameLatin: { type: String, required: true, trim: true, maxlength: 20 },
    lastNameLatin: { type: String, required: true, trim: true, maxlength: 20 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 30,
      unique: true,
    },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    dob: { type: Date, required: true },
    school: { type: String, required: true, trim: true, maxlength: 40 },
    nationalId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 11,
      unique: true,
    },
    facebook: { type: String, required: true, trim: true, maxlength: 150 },
    experience: { type: String, required: true, trim: true, maxlength: 400 },
    parentName: {
      type: String,
      trim: true,
      maxlength: 40,
      required: [isMinorDob, "მშობლის სახელი სავალდებულოა"],
    },
    parentPhone: {
      type: String,
      trim: true,
      maxlength: 20,
      required: [isMinorDob, "მშობლის ტელეფონის ნომერი სავალდებულოა"],
    },
    committees: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 3,
        message: "Exactly 3 committee preferences are required",
      },
    },
    countries: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => arr.length === 3,
        message: "Exactly 3 country preferences are required",
      },
    },
    promoCode: { type: String, trim: true, maxlength: 20 },
  },
  { timestamps: true },
);

export default mongoose.model("Delegate", delegateSchema);