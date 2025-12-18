const express = require("express");
const pool = require("../db");
const jwt = require("jsonwebtoken");
const { requireAuth } = require("../middleware/auth");

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
