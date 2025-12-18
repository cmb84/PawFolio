const db = require("../db");

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function clampInt(v, fallback, min, max) {
  const n = Number.parseInt(v, 10);
  const num = Number.isFinite(n) ? n : fallback;
  return Math.min(Math.max(num, min), max);
}

/**
 * GET comments for a post (public)
 * GET /api/comments/:postId?limit=100
 */
async function getCommentsForPost(req, res) {
  const postId = toInt(req.params.postId, 0);
  if (!postId) return res.status(400).json({ error: "Invalid post id" });

  const limit = clampInt(req.query.limit, 50, 1, 200);

  try {
    const [rows] = await db.query(
      `
      SELECT
        c.id,
        c.post_id,
        c.user_id,
        c.body,
        c.created_at,
        u.username
      FROM post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.post_id = ?
      ORDER BY c.created_at ASC, c.id ASC
      LIMIT ${limit}
      `,
      [postId]
    );

    const comments = rows.map((r) => ({
      id: r.id,
      postId: r.post_id,
      user: { id: r.user_id, username: r.username },
      body: r.body,
      createdAt: r.created_at,
    }));

    return res.json({ ok: true, comments });
  } catch (err) {
    console.error("[comments GET]", err);
    return res.status(500).json({ error: "Failed to load comments" });
  }
}

/**
 * POST a comment (auth required)
 * POST /api/comments/:postId  { body: string }
 */
async function addComment(req, res) {
  const postId = toInt(req.params.postId, 0);
  if (!postId) return res.status(400).json({ error: "Invalid post id" });

  const body = typeof req.body?.body === "string" ? req.body.body.trim() : "";
  if (!body) return res.status(400).json({ error: "Comment cannot be empty" });
  if (body.length > 1000) return res.status(400).json({ error: "Comment is too long" });

  try {
    // Ensure post exists (friendlier error than FK failure)
    const [p] = await db.query("SELECT id FROM posts WHERE id = ? LIMIT 1", [postId]);
    if (!p.length) return res.status(404).json({ error: "Post not found" });

    const [result] = await db.query(
      "INSERT INTO post_comments (post_id, user_id, body) VALUES (?, ?, ?)",
      [postId, req.user.id, body]
    );

    const [rows] = await db.query(
      `
      SELECT c.id, c.post_id, c.user_id, c.body, c.created_at, u.username
      FROM post_comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    const r = rows[0];
    return res.status(201).json({
      ok: true,
      comment: {
        id: r.id,
        postId: r.post_id,
        user: { id: r.user_id, username: r.username },
        body: r.body,
        createdAt: r.created_at,
      },
    });
  } catch (err) {
    console.error("[comments POST]", err);
    return res.status(500).json({ error: "Failed to add comment" });
  }
}

module.exports = {
  getCommentsForPost,
  addComment,
};
