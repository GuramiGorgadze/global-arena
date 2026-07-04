import express from "express";
import { registerDelegate } from "../controllers/users.js";
import rateLimit from "express-rate-limit";
import { validate } from "../middleware/validate.js";
import { delegateSchema } from "../validators/delegateSchema.js";

const UsersRouter = express.Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { err: "Too many attempts, please try again later." },
});

UsersRouter.post(
  "/delegate",
  registerLimiter,
  validate(delegateSchema),
  registerDelegate,
);

export default UsersRouter;
