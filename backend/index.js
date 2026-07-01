import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import UsersRouter from "./routes/users.js";
import connectDB from "./db/connection.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);
app.use(express.json());

app.use("/api/users", UsersRouter);

const startServer = async () => {
  await connectDB(process.env.CONNECTION_STRING);

  app.listen(PORT, () => {
    console.log(`Server has started on port ${PORT}`);
  });
};

startServer();