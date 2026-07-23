// api/index.js — Vercel serverless entry.
// Exports the Express app; Vercel invokes it as a Node function.
// Mounted at /api/* via vercel.json rewrite: source "/api/(.*)" → "/api".
import mongoose from "mongoose";
import dotenv from "dotenv";

import { createApp } from "../backend/src/app.js";

dotenv.config();

const app = createApp();

// ── Serverless-friendly DB connection (cached across warm invocations) ──
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Database connection error: Neither MONGO_URI nor MONGODB_URI environment variable is set.");
    isConnected = false;
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 2,
      minPoolSize: 1,
    });
    isConnected = true;
    console.log("✅ MongoDB connected (serverless)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    isConnected = false;
  }
}

// Ensure DB before any route handler runs.
app.use(async (_req, _res, next) => {
  await connectDB();
  next();
});

export default app;
