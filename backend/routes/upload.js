const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");

// Ensure uploads folder exists
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname) || "").toLowerCase();
    const id = crypto.randomBytes(16).toString("hex");
    cb(null, `${Date.now()}-${id}${ext || ""}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

/**
 * POST /api/upload
 * Expects multipart/form-data with field name: "image"
 */
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Missing image" });
  }

  const publicBase =
    (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`;

  const urlPath = `/uploads/${req.file.filename}`;

  res.json({
    ok: true,
    message: "Upload successful!",
    file: {
      filename: req.file.filename,
      mimetype: req.file.mimetype,
      size: req.file.size,
      url: `${publicBase}${urlPath}`,
      path: urlPath,
    },
  });
});

module.exports = router;
