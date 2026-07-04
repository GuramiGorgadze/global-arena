import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import UsersRouter from "./routes/users.js";
import connectDB from "./db/connection.js";
import { fileURLToPath } from "url";
import path from "path";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/users", UsersRouter);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../frontend/dist")));

app.get("/{*any}", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
});

const startServer = async () => {
  await connectDB(process.env.CONNECTION_STRING);

  app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
  });
};

startServer();
