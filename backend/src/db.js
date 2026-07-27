import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

let connectionPromise;

export async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not configured");

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 2,
      minPoolSize: 1,
    }).catch((error) => {
      connectionPromise = undefined;
      throw error;
    });
  }

  await connectionPromise;
}
