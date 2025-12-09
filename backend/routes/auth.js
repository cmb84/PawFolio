// routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";
import { sendMfaCode } from "../email.js";

const router = express.Router();

// Utility to generate a 6-digit MFA code
function generateMfaCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Create a short-lived JWT used just for the MFA step
function signMfaToken(userId) {
  return jwt.sign({ id: userId, stage: "mfa" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

// Create the normal auth token used by the app
function signAuthToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields." });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (username, email, password_hash, mfa_enabled) VALUES (?, ?, ?, 1)",
      [username, email, hash]
    );

    return res.json({ ok: true, message: "Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username or email already taken." });
    }
    return res.status(500).json({ error: "Registration failed." });
  }
});

// POST /api/auth/login
// Step 1: verify email + password, then either:
// - return JWT directly (if MFA disabled)
// - or send email code + return mfaToken (if MFA enabled)
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing email or password." });
    }

    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    // If MFA is disabled, behave like before: return auth token directly
    if (!user.mfa_enabled) {
      const token = signAuthToken(user.id);
      return res.json({
        ok: true,
        mfaRequired: false,
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          created_at: user.created_at,
        },
      });
    }

    // MFA enabled: generate code, save to DB, send email, return mfaToken
    const code = generateMfaCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await pool.query(
      "UPDATE users SET mfa_code = ?, mfa_expires_at = ? WHERE id = ?",
      [code, expiresAt, user.id]
    );

    try {
      await sendMfaCode(user.email, code);
    } catch (emailErr) {
      console.error("Error sending MFA email:", emailErr);
      return res
        .status(500)
        .json({ error: "Failed to send MFA code. Please try again." });
    }

    const mfaToken = signMfaToken(user.id);

    return res.json({
      ok: true,
      mfaRequired: true,
      message: "Verification code sent to your email.",
      mfaToken,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ error: "Login failed." });
  }
});

// POST /api/auth/verify-mfa
// Step 2: client sends { code, mfaToken } after /login
router.post("/verify-mfa", async (req, res) => {
  try {
    const { code, mfaToken } = req.body;

    if (!code || !mfaToken) {
      return res.status(400).json({ error: "Missing code or mfaToken." });
    }

    let decoded;
    try {
      decoded = jwt.verify(mfaToken, process.env.JWT_SECRET);
    } catch (err) {
      console.error("MFA token invalid:", err);
      return res.status(401).json({ error: "Invalid or expired MFA token." });
    }

    if (decoded.stage !== "mfa") {
      return res.status(400).json({ error: "Invalid MFA token stage." });
    }

    const userId = decoded.id;

    const [rows] = await pool.query(
      "SELECT id, username, email, created_at, mfa_code, mfa_expires_at FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    const user = rows[0];

    if (!user.mfa_code || !user.mfa_expires_at) {
      return res.status(400).json({ error: "No active MFA code. Please login again." });
    }

    const now = new Date();
    const expiresAt = new Date(user.mfa_expires_at);

    if (now > expiresAt) {
      return res.status(400).json({ error: "MFA code has expired. Please login again." });
    }

    if (String(code).trim() !== String(user.mfa_code).trim()) {
      return res.status(400).json({ error: "Invalid verification code." });
    }

    // Clear used code
    await pool.query(
      "UPDATE users SET mfa_code = NULL, mfa_expires_at = NULL WHERE id = ?",
      [user.id]
    );

    // Issue real auth token
    const token = signAuthToken(user.id);

    return res.json({
      ok: true,
      mfaRequired: false,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at,
      },
    });
  } catch (err) {
    console.error("Verify MFA error:", err);
    return res.status(500).json({ error: "MFA verification failed." });
  }
});

// GET /api/auth/me
router.get("/me", async (req, res) => {
  try {
    const auth = req.headers.authorization || "";
    const [, token] = auth.split(" ");
    if (!token) {
      return res.status(401).json({ error: "No token." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      "SELECT id, username, email, created_at FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.json({ ok: true, user: rows[0] });
  } catch (err) {
    console.error("Me error:", err);
    return res.status(401).json({ error: "Invalid token." });
  }
});

export default router;
