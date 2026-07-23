// api/index.js — Vercel serverless entry point
import mongoose from "mongoose";
import dotenv from "dotenv";

import { createApp } from "../backend/src/app.js";

dotenv.config();

const app = createApp();

// ── Serverless-friendly DB connection (cached across warm invocations) ──
let isConnected = false;
async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return true;

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.error("❌ Database connection error: MONGO_URI is not set.");
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

// Connect to DB for incoming requests (skip for health check to allow diagnostics)
app.use(async (req, res, next) => {
  const url = req.originalUrl || req.url || "";
  if (url.includes("/health")) {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Serverless connection error:", err);
    res.status(503).json({
      error: "Database Connection Error",
      message: err.message || "Failed to establish database connection"
    });
  }
});

export default app;
