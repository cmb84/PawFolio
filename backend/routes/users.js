const express = require("express");
const pool = require("../db");

const router = express.Router();

function publicBase(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  if (env) return env;
  return `${req.protocol}://${req.get("host")}`;
}

function toInt(v, fallback) {
  const n = parseInt(v, 10);
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

    const postsSql = `
      SELECT id, pet_name, species, caption, image_path, created_at
      FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
      `;

    const [prows] = await pool.execute(postsSql, [user.id]);

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
