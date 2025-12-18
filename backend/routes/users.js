const express = require("express");
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

function publicBase(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (env) return env;
  return `${req.protocol}://${req.get("host")}`;
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * GET /api/users/:username
 * Public: returns a user's public profile + their posts.
 *
 * Query params:
 *   - limit (default 24, max 60)
 *   - page  (default 1)
 */


// --- Optional column support (keeps API backward-compatible) ---
let _supportsAge = null;
async function supportsAgeColumn() {
  if (_supportsAge !== null) return _supportsAge;
  try {
    // If this column doesn't exist, MySQL will throw ER_BAD_FIELD_ERROR
    await pool.execute("SELECT age FROM users LIMIT 1");
    _supportsAge = true;
  } catch (err) {
    _supportsAge = false;
  }
  return _supportsAge;
}

async function selectSelfUser(userId) {
  const hasAge = await supportsAgeColumn();
  const sql = hasAge
    ? "SELECT id, username, email, age FROM users WHERE id = ? LIMIT 1"
    : "SELECT id, username, email FROM users WHERE id = ? LIMIT 1";
  const [rows] = await pool.execute(sql, [userId]);
  return rows[0] || null;
}

// PATCH /api/users/me — update email + age (optional)
router.patch("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const email = typeof req.body.email === "string" ? req.body.email.trim() : undefined;
    const ageRaw = req.body.age;

    const wantsEmail = email !== undefined;
    const wantsAge = "age" in (req.body || {});

    if (!wantsEmail && !wantsAge) {
      return res.status(400).json({ error: "No changes provided" });
    }

    const current = await selectSelfUser(userId);
    if (!current) return res.status(401).json({ error: "User not found" });

    const updates = [];
    const params = [];

    if (wantsEmail) {
      if (!email) return res.status(400).json({ error: "Email is required" });
      // basic email sanity check
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (email !== current.email) {
        const [dupe] = await pool.execute(
          "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
          [email, userId]
        );
        if (dupe.length) return res.status(409).json({ error: "Email is already in use" });
        updates.push("email = ?");
        params.push(email);
      }
    }

    if (wantsAge) {
      const hasAge = await supportsAgeColumn();
      if (!hasAge) {
        return res.status(400).json({
          error: "Age is not enabled in your database yet. Add an `age` column to the users table.",
        });
      }

      let age = null;
      if (ageRaw !== null && ageRaw !== "" && ageRaw !== undefined) {
        const n = Number(ageRaw);
        if (!Number.isFinite(n)) return res.status(400).json({ error: "Age must be a number" });
        age = Math.floor(n);
        if (age < 0 || age > 130) return res.status(400).json({ error: "Age must be between 0 and 130" });
      }
      updates.push("age = ?");
      params.push(age);
    }

    if (!updates.length) {
      // Nothing changed (ex: email same as current)
      const updated = await selectSelfUser(userId);
      const token = jwt.sign({ id: updated.id, email: updated.email }, process.env.JWT_SECRET, {
        expiresIn: "1d",
      });
      return res.json({ ok: true, token, user: updated });
    }

    params.push(userId);
    await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);

    const updated = await selectSelfUser(userId);
    const token = jwt.sign({ id: updated.id, email: updated.email }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.json({ ok: true, token, user: updated });
  } catch (err) {
    console.error("[users/me PATCH]", err);
    res.status(500).json({ error: "Failed to update account" });
  }
});

// DELETE /api/users/me — delete account + clean up uploads
router.delete("/me", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const password = typeof req.body.password === "string" ? req.body.password : "";
    const confirm = typeof req.body.confirm === "string" ? req.body.confirm : "";

    if (!password) return res.status(400).json({ error: "Password is required" });
    if (confirm.trim() !== "DELETE") {
      return res.status(400).json({ error: 'Type "DELETE" to confirm deletion' });
    }

    const [rows] = await pool.execute(
      "SELECT id, email, password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length) return res.status(401).json({ error: "User not found" });

    const match = await bcrypt.compare(password, rows[0].password_hash);
    if (!match) return res.status(400).json({ error: "Incorrect password" });

    // Gather upload files (best-effort cleanup)
    const [prows] = await pool.execute("SELECT image_path FROM posts WHERE user_id = ?", [userId]);
    const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
    const filesToDelete = (prows || [])
      .map((r) => r.image_path)
      .filter(Boolean)
      .map((p) => p.replace(/^\/uploads\//, ""))
      .map((fname) => path.join(uploadDir, fname));

    // Delete user (posts cascade via FK)
    await pool.execute("DELETE FROM users WHERE id = ? LIMIT 1", [userId]);

    // Best-effort file cleanup
    for (const fpath of filesToDelete) {
      try {
        fs.unlinkSync(fpath);
      } catch (_) {}
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("[users/me DELETE]", err);
    res.status(500).json({ error: "Failed to delete account" });
  }
});


router.get("/:username", async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ error: "Missing username" });

    const limit = Math.min(Math.max(toInt(req.query.limit, 24), 1), 60);
    const page = Math.max(toInt(req.query.page, 1), 1);
    const offset = (page - 1) * limit;

    const [urows] = await pool.execute(
      "SELECT id, username FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (urows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = urows[0];

    const [[countRow]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM posts WHERE user_id = ?",
      [user.id]
    );

    const [prows] = await pool.execute(
      `
      SELECT id, pet_name, species, caption, image_path, created_at
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
      `,
      [user.id, limit, offset]
    );

    const base = publicBase(req);
    const posts = prows.map((p) => ({
      id: p.id,
      petName: p.pet_name,
      species: p.species,
      caption: p.caption,
      imagePath: p.image_path,
      imageUrl: p.image_path ? `${base}${p.image_path}` : null,
      createdAt: p.created_at,
      user: { id: user.id, username: user.username },
    }));

    res.json({
      ok: true,
      user: { id: user.id, username: user.username },
      stats: { postCount: countRow?.c || 0 },
      posts,
      page,
      limit,
    });
  } catch (err) {
    console.error("[users/:username]", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

module.exports = router;
