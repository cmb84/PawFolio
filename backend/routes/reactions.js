const express = require("express");
const { requireAuth } = require("../middleware/auth"); // ✅ correct import
const {
  getReactionsForPost,
  toggleReaction,
} = require("../controllers/reactionsController");

const router = express.Router();

// Public: fetch reaction counts
router.get("/:postId", getReactionsForPost);

// Protected: toggle reaction
router.post("/:postId", requireAuth, toggleReaction);

module.exports = router;