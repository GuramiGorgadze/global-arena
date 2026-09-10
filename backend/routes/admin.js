import express from "express";
import { sendPaymentEmails } from "../controllers/admin.js";
import { rateLimit, ipKeyGenerator } from "express-rate-limit";

const AdminRouter = express.Router();

const sendPaymentEmailsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts, please try again later." },
  keyGenerator: (req) => ipKeyGenerator(req.ip),
});

AdminRouter.post(
  "/send-payment-emails",
  sendPaymentEmailsLimiter,
  sendPaymentEmails
);

export default AdminRouter;