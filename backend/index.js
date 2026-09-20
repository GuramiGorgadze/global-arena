import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import UsersRouter from "./routes/users.js";
import MarathonRouter from "./routes/marathon.js";
import AdminRouter from "./routes/admin.js";
import MunRouter from "./routes/mun.js";
import connectDB from "./db/connection.js";
import helmet from "helmet";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "https://plausible.io"],
        connectSrc: ["'self'", "https://plausible.io"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
        fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
        // flagcdn.com serves every country flag the MUN Command console
        // shows. Without it here the browser silently blocks each flag
        // image and Flag.jsx falls back to the emoji version for all of
        // them — this was missing before and would have broken every flag
        // in production.
        imgSrc: ["'self'", "data:", "https://flagcdn.com"],
      },
    },
  }),
);

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
// The MUN Command console stores a full committee session — roll call,
// motions, votes, documents, minutes — in one document per save, which
// comfortably exceeds Express's 100kb default body limit.
app.use(express.json({ limit: "2mb" }));

app.use("/api/users", UsersRouter);
app.use("/api/marathon", MarathonRouter);
app.use("/api/admin", AdminRouter);
app.use("/api/mun", MunRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: "Something went wrong on the server.",
  });
});

const startServer = async () => {
  await connectDB(process.env.CONNECTION_STRING);

  app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
  });
};

startServer();