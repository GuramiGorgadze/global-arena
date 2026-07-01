import mongoose from "mongoose";

const { Schema } = mongoose;

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
    },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    dob: { type: Date, required: true },
    school: { type: String, required: true, trim: true, maxlength: 40 },
    nationalId: { type: String, required: true, trim: true, maxlength: 11 },
    facebook: { type: String, required: true, trim: true, maxlength: 150 },
    experience: { type: String, required: true, trim: true, maxlength: 300 },
    parentName: { type: String, required: true, trim: true, maxlength: 40 },
    parentPhone: { type: String, required: true, trim: true, maxlength: 20 },
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
  },
  { timestamps: true },
);

export default mongoose.model("Delegate", delegateSchema);
