import express from "express";
import { registerDelegate } from "../controllers/users.js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const UsersRouter = express.Router();

const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => {
    const email =
      typeof req.body?.email === "string"
        ? req.body.email.toLowerCase().trim()
        : "";
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
});

UsersRouter.post("/delegate", registerLimiter, registerDelegate);

export default UsersRouter;
