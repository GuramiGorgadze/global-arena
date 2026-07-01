import express from "express";
import { registerDelegate } from "../controllers/users.js";

const UsersRouter = express.Router();

UsersRouter.post("/delegate", registerDelegate);

export default UsersRouter;