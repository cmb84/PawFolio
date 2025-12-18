const db = require("../db");

/**
 * GET reactions for a post
 */
async function getReactionsForPost(req, res) {
  const { postId } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT emoji, COUNT(*) AS count
      FROM post_reactions
      WHERE post_id = ?
      GROUP BY emoji
      `,
      [postId]
    );

    const counts = {};
    rows.forEach((r) => {
      counts[r.emoji] = r.count;
    });

    res.json({ counts });
  } catch (err) {
    console.error("Get reactions error:", err);
    res.status(500).json({ error: "Failed to load reactions" });
  }
}

/**
 * POST toggle reaction
 */
async function toggleReaction(req, res) {
  const { postId } = req.params;
  const { emoji } = req.body;
  const userId = req.user.id;

  if (!emoji) {
    return res.status(400).json({ error: "Emoji is required" });
  }

  try {
    const [existing] = await db.query(
      `
      SELECT id FROM post_reactions
      WHERE post_id = ? AND user_id = ? AND emoji = ?
      `,
      [postId, userId, emoji]
    );

    if (existing.length > 0) {
      await db.query(
        `
        DELETE FROM post_reactions
        WHERE post_id = ? AND user_id = ? AND emoji = ?
        `,
        [postId, userId, emoji]
      );
      return res.json({ removed: true });
    }

    await db.query(
      `
      INSERT INTO post_reactions (post_id, user_id, emoji)
      VALUES (?, ?, ?)
      `,
      [postId, userId, emoji]
    );

    res.json({ added: true });
  } catch (err) {
    console.error("Toggle reaction error:", err);
    res.status(500).json({ error: "Failed to update reaction" });
  }
}

module.exports = {
  getReactionsForPost,
  toggleReaction,
};