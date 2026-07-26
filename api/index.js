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
  if (isConnected) return;
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not configured");
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 2,
      minPoolSize: 1,
    });
    isConnected = true;
    console.log("✅ MongoDB connected (serverless)");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Don't mark connected; the next invocation retries.
    throw err;
  }
}

// Vercel invokes this wrapper before Express. Adding middleware to `app` here
// would append it after the already-registered routes, allowing those routes
// to query Mongoose before the serverless connection exists.
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (err) {
    console.error("Database unavailable:", err.message);
    return res.status(503).json({ error: "Database service is unavailable" });
  }
}
