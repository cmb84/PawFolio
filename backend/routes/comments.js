const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  getCommentsForPost,
  addComment,
} = require("../controllers/commentsController");

const router = express.Router();

// Public: fetch comments for a post
router.get("/:postId", getCommentsForPost);

// Protected: add a comment
router.post("/:postId", requireAuth, addComment);

module.exports = router;
