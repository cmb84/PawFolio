const express = require("express");
const auth = require("../middleware/auth");
const {
  getReactionsForPost,
  toggleReaction,
} = require("../controllers/reactionsController");

const router = express.Router();

// Public: get reaction counts for a post
router.get("/:postId", getReactionsForPost);

// Protected: add/remove reaction
router.post("/:postId", auth, toggleReaction);

module.exports = router;