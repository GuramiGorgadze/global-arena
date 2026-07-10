import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import UsersRouter from "./routes/users.js";
import VisitsRouter from "./routes/visits.js";
import { trackVisit } from "./controllers/visits.js";
import connectDB from "./db/connection.js";
import helmet from "helmet";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();
app.set("trust proxy", 1);
app.use(helmet());

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  }),
);
app.use(express.json());

app.use(trackVisit);
app.use("/api/users", UsersRouter);
app.use("/api/visits", VisitsRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: "სერვერზე მოხდა შეცდომა.",
  });
});

const startServer = async () => {
  await connectDB(process.env.CONNECTION_STRING);

  app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
  });
};

startServer();
