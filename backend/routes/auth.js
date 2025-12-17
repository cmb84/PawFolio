import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db.js";

const router = express.Router();

/**
 * Helper: ensure JWT secret exists
 */
function requireJwtSecret() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }
}

/**
 * POST /api/auth/register
 */
router.post("/register", async (req, res) => {
  try {
    requireJwtSecret();

    const { username, email, password } = req.body || {};

    // Basic validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing fields." });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters." });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Insert user
    await pool.query(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, passwordHash]
    );

    return res.status(201).json({
      ok: true,
      message: "Registration successful"
    });
  } catch (err) {
    console.error("Register error:", err);

    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Username or email already taken." });
    }

    if (err.message?.includes("JWT_SECRET")) {
      return res.status(500).json({ error: "Server misconfiguration." });
    }

    return res.status(500).json({ error: "Registration failed." });
  }
});

/**
 * POST /api/auth/login
 */
router.post("/login", async (req, res) => {
  try {
    requireJwtSecret();

    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ error: "Missing fields." });
    }

    const [rows] = await pool.query(
      "SELECT id, username, email, password_hash, created_at FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      }
    });
  } catch (err) {
    console.error("Login error:", err);

    if (err.message?.includes("JWT_SECRET")) {
      return res.status(500).json({ error: "Server misconfiguration." });
    }

    return res.status(500).json({ error: "Login failed." });
  }
});

/**
 * GET /api/auth/me
 */
router.get("/me", async (req, res) => {
  try {
    requireJwtSecret();

    const authHeader = req.headers.authorization || "";
    const [, token] = authHeader.split(" ");

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