import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

//Routes Import
import userRouter from "./routes/user.routes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

//Routes Declaration
app.use("/api/user", userRouter);
export { app };
