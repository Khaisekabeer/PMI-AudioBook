import express from "express";
import mongoose from "mongoose";
import { signup, login, forgotPassword, resetPassword, refreshToken, logout } from "../controllers/authController.js";
import { uploadAudio, uploadCover } from "../controllers/uploadController.js";
import { verifyToken, requireAdmin, authLimiter, passwordResetLimiter } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/upload.js";
import { OAuth2Client } from "google-auth-library";
import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const router = express.Router();

// Google OAuth setup (Keeping inline for now as it uses specific libs, can be refactored later)
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

router.post("/google", authLimiter, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'No token provided' });

    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: token,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch (idTokenError) {
      try {
        // Fallback: Try using it as an access token
        const response = await fetch(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`);
        if (!response.ok) {
          throw new Error(`Failed to fetch user info from Google: ${response.statusText}`);
        }
        payload = await response.json();
      } catch (accessTokenError) {
        console.error("Google Auth failed. ID Token error:", idTokenError.message);
        console.error("Access Token error:", accessTokenError.message);
        return res.status(401).json({ 
            error: 'Invalid Google token', 
            details: idTokenError.message || accessTokenError.message
        });
      }
    }

    if (!payload || !payload.email) {
      return res.status(400).json({ error: 'No email found in Google profile' });
    }

    if (mongoose.connection.readyState !== 1) {
      console.error("Database connection is not ready. Current readyState:", mongoose.connection.readyState);
      return res.status(503).json({
        error: "Database Connection Error",
        message: "Database is not connected. Please ensure MONGO_URI (or MONGODB_URI) is set in Vercel Environment Variables and Network Access (0.0.0.0/0) is configured in MongoDB Atlas."
      });
    }

    let user = await User.findOne({ email: payload.email });
    if (!user) {
      const hashedDummy = await bcrypt.hash("google-oauth", 10);
      user = await User.create({
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
        password: hashedDummy,
        profilePicture: payload.picture || ''
      });
    }

    const secret = process.env.JWT_SECRET || "default_jwt_secret_pmi_audiobook_2026";
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email },
      secret,
      { expiresIn: "1h" }
    );

    res.json({
      success: true,
      token: jwtToken,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error("Google authentication error:", err);
    res.status(500).json({
      error: "Google Authentication Failed",
      message: err.message || "Server error during Google sign in"
    });
  }
});

// Auth Routes (rate-limited to slow brute-force attacks)
router.post("/signup", authLimiter, signup);
router.post("/login", authLimiter, login);
router.post("/forgot-password", passwordResetLimiter, forgotPassword);
router.post("/reset-password", passwordResetLimiter, resetPassword);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);

// File upload routes (admin only)
router.post("/upload/audio", verifyToken, requireAdmin, upload.single('audioFile'), uploadAudio);
router.post("/upload/cover", verifyToken, requireAdmin, upload.single('coverImage'), uploadCover);

export default router;
