import { createApp } from "../backend/src/app.js";
import { connectDB } from "../backend/src/db.js";

const app = createApp();

// Connect before Express receives the request. The shared helper is located
// next to the models so the connection and models use the same Mongoose copy.
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Database unavailable:", error.message);
    return res.status(503).json({ error: "Database service is unavailable" });
  }
}
