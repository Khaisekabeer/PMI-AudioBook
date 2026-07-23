// api/index.js — Vercel serverless entry.
// Exports the Express app; Vercel invokes it as a Node function.
// Mounted at /api/* via vercel.json rewrite: source "/api/(.*)" → "/api".
import mongoose from "mongoose";
import dotenv from "dotenv";

import { createApp } from "../backend/src/app.js";

dotenv.config();

// Disable command buffering in serverless to prevent function invocation hangs/timeouts
mongoose.set("bufferCommands", false);

const app = createApp();

// ── Serverless-friendly DB connection (cached across warm invocations) ──
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return true;

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Database connection error: Neither MONGO_URI nor MONGODB_URI environment variable is set.");
    isConnected = false;
    return false;
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
    return true;
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    isConnected = false;
    return false;
  }
}

// Ensure DB before any route handler runs (skip for health check to avoid blocking diagnostics).
app.use(async (req, res, next) => {
  try {
    if (req.path === "/api/health" || req.path === "/health") {
      return next();
    }
    await connectDB();
    next();
  } catch (err) {
    console.error("Serverless middleware error:", err);
    res.status(500).json({
      error: "Server Initialization Error",
      message: err.message || "Failed to process request in serverless environment",
    });
  }
});

export default app;
