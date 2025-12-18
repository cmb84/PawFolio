const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const pool = require("../db.js");

const requireAuth = require("../middleware/requireAuth");
const { sendMfaCodeEmail } = require("../utils/ses");
const {
  DEFAULT_TTL_MINUTES,
  MAX_ATTEMPTS,
  generateCode,
  generateChallengeId,
  expiresAtDate,
  hashCode,
  maskEmail,
} = require("../utils/mfa");

const router = express.Router();

function logError(label, err) {
  console.error(`\n===== ${label} ERROR =====`);
  console.error(err);
  console.error("================================\n");
}

async function createMfaChallenge({ userId, purpose = "login" }) {
  const challengeId = generateChallengeId();
  const code = generateCode();
  const codeHash = await hashCode(code);
  const expiresAt = expiresAtDate(DEFAULT_TTL_MINUTES);

  await pool.execute(
    "INSERT INTO mfa_challenges(id, user_id, purpose, code_hash, expires_at, consumed, attempts) VALUES(?, ?, ?, ?, ?, 0, 0)",
    [challengeId, userId, purpose, codeHash, expiresAt]
  );

  return { challengeId, code, expiresAt };
}

async function consumeMfaChallenge({ challengeId }) {
  await pool.execute("UPDATE mfa_challenges SET consumed = 1 WHERE id = ?", [
    challengeId,
  ]);
}

async function incrementMfaAttempts({ challengeId }) {
  await pool.execute(
    "UPDATE mfa_challenges SET attempts = attempts + 1 WHERE id = ?",
    [challengeId]
  );
}

async function getMfaChallengeWithUser(challengeId) {
  const [rows] = await pool.execute(
    `SELECT c.id, c.user_id, c.purpose, c.code_hash, c.expires_at, c.consumed, c.attempts,
            u.email, u.username, COALESCE(u.mfa_enabled, 0) AS mfa_enabled
     FROM mfa_challenges c
     JOIN users u ON u.id = c.user_id
     WHERE c.id = ?
     LIMIT 1`,
    [challengeId]
  );
  return rows[0] || null;
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [existing] = await pool.execute(
      "SELECT id FROM users WHERE email = ? OR username = ?",
      [email, username]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    await pool.execute(
      "INSERT INTO users(username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashed]
    );

    res.json({ ok: true, message: "Registration successful" });
  } catch (err) {
    logError("REGISTER", err);
    res.status(500).json({ error: "Registration failed" });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Missing credentials" });
    }

    const [rows] = await pool.execute("SELECT * FROM users WHERE email = ?", [
      email,
    ]);

    if (rows.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = rows[0];

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const mfaEnabled = !!user.mfa_enabled;

    if (mfaEnabled) {
      const { challengeId, code } = await createMfaChallenge({
        userId: user.id,
        purpose: "login",
      });

      try {
        await sendMfaCodeEmail({
          toEmail: user.email,
          toName: user.username,
          code,
          purpose: "login",
        });
      } catch (mailErr) {
        logError("MAILJET_SEND", mailErr);
        return res
          .status(500)
          .json({ error: "Failed to send verification code email" });
      }

      return res.json({
        ok: true,
        mfaRequired: true,
        challengeId,
        expiresInMinutes: DEFAULT_TTL_MINUTES,
        email: maskEmail(user.email),
      });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        mfa_enabled: mfaEnabled,
      },
    });
  } catch (err) {
    logError("LOGIN", err);
    res.status(500).json({ error: "Login failed" });
  }
});

// MFA VERIFY
router.post("/mfa/verify", async (req, res) => {
  try {
    const { challengeId, code } = req.body;

    if (!challengeId || !code) {
      return res.status(400).json({ error: "Missing challengeId or code" });
    }

    const row = await getMfaChallengeWithUser(challengeId);
    if (!row) return res.status(400).json({ error: "Invalid verification request" });

    if (row.consumed) {
      return res.status(400).json({ error: "This code was already used" });
    }

    const expiresAt = new Date(row.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "This code has expired" });
    }

    if (Number(row.attempts || 0) >= MAX_ATTEMPTS) {
      return res
        .status(429)
        .json({ error: "Too many attempts. Please log in again." });
    }

    const ok = await bcrypt.compare(String(code), row.code_hash);
    if (!ok) {
      await incrementMfaAttempts({ challengeId });
      return res.status(400).json({ error: "Invalid code" });
    }

    await consumeMfaChallenge({ challengeId });

    const token = jwt.sign(
      { id: row.user_id, email: row.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      ok: true,
      token,
      user: {
        id: row.user_id,
        username: row.username,
        email: row.email,
        mfa_enabled: true,
      },
    });
  } catch (err) {
    logError("MFA VERIFY", err);
    res.status(500).json({ error: "Verification failed" });
  }
});

// MFA TOGGLE (start)
router.patch("/mfa", requireAuth, async (req, res) => {
  try {
    const { enabled } = req.body;
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "enabled must be boolean" });
    }

    const [rows] = await pool.execute(
      "SELECT id, username, email, COALESCE(mfa_enabled, 0) AS mfa_enabled FROM users WHERE id = ?",
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "User not found" });

    const user = rows[0];
    const currentlyEnabled = !!user.mfa_enabled;

    if (enabled === currentlyEnabled) {
      return res.json({ ok: true, mfa_enabled: currentlyEnabled });
    }

    const purpose = enabled ? "enable" : "disable";
    const { challengeId, code } = await createMfaChallenge({
      userId: user.id,
      purpose,
    });

    try {
      await sendMfaCodeEmail({
        toEmail: user.email,
        toName: user.username,
        code,
        purpose,
      });
    } catch (mailErr) {
      logError("MAILJET_SEND", mailErr);
      return res
        .status(500)
        .json({ error: "Failed to send verification code email" });
    }

    return res.json({
      ok: true,
      confirmRequired: true,
      challengeId,
      requestedEnabled: enabled,
      expiresInMinutes: DEFAULT_TTL_MINUTES,
      email: maskEmail(user.email),
    });
  } catch (err) {
    logError("MFA TOGGLE", err);
    res.status(500).json({ error: "MFA update failed" });
  }
});

// MFA CONFIRM (finish)
router.post("/mfa/confirm", requireAuth, async (req, res) => {
  try {
    const { challengeId, code } = req.body;
    if (!challengeId || !code) {
      return res.status(400).json({ error: "Missing challengeId or code" });
    }

    const row = await getMfaChallengeWithUser(challengeId);
    if (!row) return res.status(400).json({ error: "Invalid verification request" });
    if (row.user_id !== req.user.id) {
      return res.status(403).json({ error: "Not allowed" });
    }
    if (row.consumed) return res.status(400).json({ error: "This code was already used" });

    const expiresAt = new Date(row.expires_at);
    if (expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ error: "This code has expired" });
    }
    if (Number(row.attempts || 0) >= MAX_ATTEMPTS) {
      return res.status(429).json({ error: "Too many attempts" });
    }

    if (row.purpose !== "enable" && row.purpose !== "disable") {
      return res.status(400).json({ error: "Invalid MFA confirmation" });
    }

    const ok = await bcrypt.compare(String(code), row.code_hash);
    if (!ok) {
      await incrementMfaAttempts({ challengeId });
      return res.status(400).json({ error: "Invalid code" });
    }

    await consumeMfaChallenge({ challengeId });
    const enabled = row.purpose === "enable";

    await pool.execute("UPDATE users SET mfa_enabled = ? WHERE id = ?", [
      enabled ? 1 : 0,
      req.user.id,
    ]);

    return res.json({ ok: true, mfa_enabled: enabled });
  } catch (err) {
    logError("MFA CONFIRM", err);
    res.status(500).json({ error: "MFA confirmation failed" });
  }
});

// AUTH ME (include mfa_enabled)
router.get("/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: "Missing token" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const [rows] = await pool.execute(
      "SELECT id, username, email, COALESCE(mfa_enabled, 0) AS mfa_enabled FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ ok: true, user: rows[0] });
  } catch (err) {
    logError("AUTH ME", err);
    res.status(401).json({ error: "Invalid token" });
  }
});

module.exports = router;
