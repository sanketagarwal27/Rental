import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGO_URI}/${DB_NAME}`,
    );
    console.log(`Connected to DB: ${connectionInstance.connection.host}`);
  } catch (err) {
    console.error("Error connecting to DB", err);
    throw err;
  }
};
