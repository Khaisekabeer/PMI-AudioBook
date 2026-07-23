// api/index.js — Vercel serverless entry point
import mongoose from "mongoose";
import dotenv from "dotenv";

import { createApp } from "../backend/src/app.js";

dotenv.config();

const app = createApp();

// ── Serverless-friendly DB connection (cached across warm invocations) ──
let isConnected = false;
let lastDbError = null;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) {
    lastDbError = null;
    return true;
  }

  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!mongoUri) {
    lastDbError = "Neither MONGO_URI nor MONGODB_URI environment variable is configured in Vercel.";
    console.error("❌ Database connection error:", lastDbError);
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
    lastDbError = null;
    console.log("✅ MongoDB connected (serverless)");
    return true;
  } catch (err) {
    lastDbError = err.message || String(err);
    console.error("MongoDB connection error:", lastDbError);
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

  const connected = await connectDB();
  if (!connected || mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      error: "Database Connection Error",
      message: lastDbError || "Failed to establish MongoDB connection.",
      help: "Check MONGO_URI in Vercel Environment Variables and verify Network Access (0.0.0.0/0) in MongoDB Atlas."
    });
  }
  next();
});

export default app;
