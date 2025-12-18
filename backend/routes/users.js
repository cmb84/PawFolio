const express = require("express");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");

const router = express.Router();

function publicBase(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  // If not set, return empty and let the frontend resolve relative /uploads/... URLs.
  if (env) return env;
  return "";
}

function getViewerId(req) {
  const header = req.headers["authorization"];
  if (!header) return null;
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) return null;

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) return null;
    const decoded = jwt.verify(token, secret);
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(v, fallback, min, max) {
  const n = Number.parseInt(v, 10);
  const num = Number.isFinite(n) ? n : fallback;
  return Math.min(Math.max(num, min), max);
}

function optionalViewerId(req) {
  try {
    const auth = req.headers.authorization || "";
    if (!auth.startsWith("Bearer ")) return null;
    const token = auth.slice(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    return decoded?.id ?? null;
  } catch {
    return null;
  }
}
/**
 * PATCH /api/users/me
 * Auth: change email and/or password (requires current password)
 * Body:
 *   - currentPassword (required)
 *   - email (optional)
 *   - newPassword (optional)
 */
router.patch("/me", requireAuth, async (req, res) => {
  const userId = req.user.id;

  const email = typeof req.body?.email === "string" ? req.body.email.trim() : undefined;
  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword : undefined;

  if (!currentPassword) {
    return res.status(400).json({ error: "Current password is required" });
  }
  if (email === undefined && newPassword === undefined) {
    return res.status(400).json({ error: "No changes provided" });
  }

  try {
    const [rows] = await pool.execute(
      "SELECT id, username, email, password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length) return res.status(401).json({ error: "User not found" });

    const user = rows[0];
    const ok = await bcrypt.compare(currentPassword, user.password_hash);
    if (!ok) return res.status(400).json({ error: "Incorrect password" });

    const updates = [];
    const params = [];

    if (email !== undefined) {
      if (!email) return res.status(400).json({ error: "Email is required" });
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
      }

      if (email !== user.email) {
        const [dupe] = await pool.execute(
          "SELECT id FROM users WHERE email = ? AND id <> ? LIMIT 1",
          [email, userId]
        );
        if (dupe.length) return res.status(409).json({ error: "Email is already in use" });

        updates.push("email = ?");
        params.push(email);
      }
    }

    if (newPassword !== undefined) {
      if (!newPassword || newPassword.length < 8) {
        return res.status(400).json({ error: "New password must be at least 8 characters" });
      }
      const hashed = await bcrypt.hash(newPassword, 10);
      updates.push("password_hash = ?");
      params.push(hashed);
    }

    if (updates.length) {
      params.push(userId);
      await pool.execute(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
    }

    const [u2] = await pool.execute(
      "SELECT id, username, email FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const updated = u2[0];

    const token = jwt.sign(
      { id: updated.id, email: updated.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ ok: true, token, user: updated });
  } catch (err) {
    console.error("[users/me PATCH]", err);
    return res.status(500).json({ error: "Failed to update account" });
  }
});

/**
 * DELETE /api/users/me
 * Auth: delete account (requires password + typing DELETE)
 * Body:
 *   - password (required)
 *   - confirm (must equal "DELETE")
 */
router.delete("/me", requireAuth, async (req, res) => {
  const userId = req.user.id;
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const confirm = typeof req.body?.confirm === "string" ? req.body.confirm.trim() : "";

  if (!password) return res.status(400).json({ error: "Password is required" });
  if (confirm !== "DELETE") return res.status(400).json({ error: 'Type "DELETE" to confirm deletion' });

  const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

  let conn;
  try {
    const [rows] = await pool.execute(
      "SELECT id, password_hash FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    if (!rows.length) return res.status(401).json({ error: "User not found" });

    const ok = await bcrypt.compare(password, rows[0].password_hash);
    if (!ok) return res.status(400).json({ error: "Incorrect password" });

    // Get list of images to delete (best-effort)
    const [prows] = await pool.execute(
      "SELECT image_path FROM posts WHERE user_id = ?",
      [userId]
    );
    const filesToDelete = (prows || [])
      .map((r) => r.image_path)
      .filter(Boolean)
      .map((p) => p.replace(/^\/uploads\//, ""))
      .map((fname) => path.join(uploadDir, fname));

    conn = await pool.getConnection();
    await conn.beginTransaction();

    // Clean follows table (if present)
    await conn.execute("DELETE FROM follows WHERE follower_id = ? OR following_id = ?", [userId, userId]);

    // Delete posts (uploads cleanup happens after commit)
    await conn.execute("DELETE FROM posts WHERE user_id = ?", [userId]);

    // Delete user
    await conn.execute("DELETE FROM users WHERE id = ? LIMIT 1", [userId]);

    await conn.commit();
    conn.release();
    conn = null;

    // Best-effort remove files
    for (const fpath of filesToDelete) {
      try {
        fs.unlinkSync(fpath);
      } catch (_) {}
    }

    return res.json({ ok: true });
  } catch (err) {
    if (conn) {
      try { await conn.rollback(); } catch (_) {}
      try { conn.release(); } catch (_) {}
    }
    console.error("[users/me DELETE]", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
});

/**
 * GET /api/users/:username
 * Public: returns a user's public profile + their posts.
 *
 * Query params:
 *   - limit (default 24, max 60)
 *   - page  (default 1)
 */
router.get("/:username", async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ error: "Missing username" });

    const limit = clampInt(req.query.limit, 24, 1, 60);
    const page = clampInt(req.query.page, 1, 1, 10_000);
    const offset = (page - 1) * limit;

    const viewerId = optionalViewerId(req);

    const [urows] = await pool.execute(
      "SELECT id, username FROM users WHERE username = ? LIMIT 1",
      [username]
    );

    if (urows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = urows[0];

    const [[postCountRow]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM posts WHERE user_id = ?",
      [user.id]
    );

    // Followers: people who follow this user
    const [[followerCountRow]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM follows WHERE following_id = ?",
      [user.id]
    );

    // Following: people this user follows
    const [[followingCountRow]] = await pool.execute(
      "SELECT COUNT(*) AS c FROM follows WHERE follower_id = ?",
      [user.id]
    );

    let isFollowing = false;
    if (viewerId && viewerId !== user.id) {
      const [r] = await pool.execute(
        "SELECT 1 AS x FROM follows WHERE follower_id = ? AND following_id = ? LIMIT 1",
        [viewerId, user.id]
      );
      isFollowing = r.length > 0;
    }

    // MySQL prepared statements can be picky about LIMIT/OFFSET placeholders.
    // We clamp ints above and safely interpolate.
    const [prows] = await pool.execute(
      `
      SELECT id, pet_name, species, caption, image_path, created_at
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `,
      [user.id]
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
      stats: {
        postCount: postCountRow?.c || 0,
        followerCount: followerCountRow?.c || 0,
        followingCount: followingCountRow?.c || 0,
        isFollowing,
      },
      posts,
      page,
      limit,
    });
  } catch (err) {
    console.error("[users/:username]", err);
    res.status(500).json({ error: "Failed to load user profile" });
  }
});

/**
 * POST /api/users/:username/follow
 * Auth: follow a user
 */
router.post("/:username/follow", requireAuth, async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ error: "Missing username" });

    const [urows] = await pool.execute(
      "SELECT id, username FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    if (urows.length === 0) return res.status(404).json({ error: "User not found" });

    const target = urows[0];
    if (target.id === req.user.id) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    await pool.execute(
      "INSERT IGNORE INTO follows (follower_id, following_id) VALUES (?, ?)",
      [req.user.id, target.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[users/:username/follow POST]", err);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

/**
 * DELETE /api/users/:username/follow
 * Auth: unfollow a user
 */
router.delete("/:username/follow", requireAuth, async (req, res) => {
  try {
    const username = (req.params.username || "").trim();
    if (!username) return res.status(400).json({ error: "Missing username" });

    const [urows] = await pool.execute(
      "SELECT id, username FROM users WHERE username = ? LIMIT 1",
      [username]
    );
    if (urows.length === 0) return res.status(404).json({ error: "User not found" });

    const target = urows[0];
    await pool.execute(
      "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
      [req.user.id, target.id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("[users/:username/follow DELETE]", err);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

module.exports = router;
