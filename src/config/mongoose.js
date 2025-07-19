import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

export default async () => {
  try {
    const url = process.env.MONGODB_URL;
    await mongoose.connect(url);
    console.log("✅ MongoDB connected");
  } catch (error) {
    console.error("❌ MongoDB connection error", error);
    throw new Error("❌ MongoDB connection error");
  }
};
