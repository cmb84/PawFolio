const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");

const pool = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "..", "uploads");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const allowedMime = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/heic",
  "image/heif",
]);

function publicBase(req) {
  const env = (process.env.PUBLIC_BASE_URL || "").replace(/\/$/, "");
  // If not set, return empty and let the frontend resolve relative /uploads/... URLs.
  if (env) return env;
  return "";
}

function toInt(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

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
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!allowedMime.has(file.mimetype)) {
      return cb(new Error("Invalid file type"));
    }
    cb(null, true);
  },
});

/**
 * GET /api/posts/recent?limit=24
 * Public: returns most recent pet posts (for Home feed).
 */
router.get("/recent", async (req, res) => {
  try {
    const limit = Math.min(Math.max(toInt(req.query.limit, 24), 1), 60);

    // NOTE: MySQL prepared statements don't reliably support placeholders in LIMIT/OFFSET
    // across environments. We safely interpolate after clamping to an integer.
    const [rows] = await pool.execute(
      `
      SELECT
        p.id,
        p.user_id,
        p.pet_name,
        p.species,
        p.caption,
        p.image_path,
        p.created_at,
        u.username
      FROM posts p
      JOIN users u ON u.id = p.user_id
      ORDER BY p.created_at DESC
      LIMIT ${limit}
      `
    );

    const base = publicBase(req);
    const posts = rows.map((r) => ({
      id: r.id,
      petName: r.pet_name,
      species: r.species,
      caption: r.caption,
      imagePath: r.image_path,
      // imageUrl is intentionally relative by default (unless PUBLIC_BASE_URL is set)
      imageUrl: r.image_path ? `${base}${r.image_path}` : null,
      createdAt: r.created_at,
      user: { id: r.user_id, username: r.username },
    }));

    res.json({ ok: true, posts });
  } catch (err) {
    console.error("[posts/recent]", err);
    res.status(500).json({ error: "Failed to load recent posts" });
  }
});

/**
 * GET /api/posts/:id
 * Public: fetch a single post.
 */
router.get("/:id", async (req, res) => {
  try {
    const id = toInt(req.params.id, 0);
    if (!id) return res.status(400).json({ error: "Invalid post id" });

    const [rows] = await pool.execute(
      `
      SELECT
        p.id,
        p.user_id,
        p.pet_name,
        p.species,
        p.caption,
        p.image_path,
        p.created_at,
        u.username
      FROM posts p
      JOIN users u ON u.id = p.user_id
      WHERE p.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: "Post not found" });

    const r = rows[0];
    const base = publicBase(req);
    const post = {
      id: r.id,
      petName: r.pet_name,
      species: r.species,
      caption: r.caption,
      imagePath: r.image_path,
      imageUrl: r.image_path ? `${base}${r.image_path}` : null,
      createdAt: r.created_at,
      user: { id: r.user_id, username: r.username },
    };

    res.json({ ok: true, post });
  } catch (err) {
    console.error("[posts/:id]", err);
    res.status(500).json({ error: "Failed to load post" });
  }
});

/**
 * POST /api/posts
 * Auth required.
 * Expects multipart/form-data:
 *  - image (file)
 *  - petName (string)
 *  - species (string)
 *  - caption (string, optional)
 */
router.post("/", requireAuth, upload.single("image"), async (req, res) => {
  const file = req.file;
  try {
    const petName = (req.body.petName || "").trim();
    const species = (req.body.species || "").trim();
    const caption = (req.body.caption || "").trim();

    if (!file) return res.status(400).json({ error: "Missing image" });
    if (!petName) return res.status(400).json({ error: "Missing pet name" });
    if (!species) return res.status(400).json({ error: "Missing species" });

    const imagePath = `/uploads/${file.filename}`;

    const [result] = await pool.execute(
      `INSERT INTO posts(user_id, pet_name, species, caption, image_path)
       VALUES (?, ?, ?, ?, ?)` ,
      [req.user.id, petName, species, caption, imagePath]
    );

    const base = publicBase(req);

    res.status(201).json({
      ok: true,
      post: {
        id: result.insertId,
        petName,
        species,
        caption,
        imagePath,
        imageUrl: `${base}${imagePath}`,
        createdAt: new Date().toISOString(),
        user: { id: req.user.id },
      },
    });
  } catch (err) {
    console.error("[posts/create]", err);
    // If the DB insert fails, remove the uploaded file so we don't orphan it
    if (file?.path) {
      try {
        fs.unlinkSync(file.path);
      } catch (_) {}
    }
    res.status(500).json({ error: "Failed to create post" });
  }
});

// Multer / upload errors (invalid file type, size limits, etc.)
router.use((err, req, res, next) => {
  if (!err) return next();
  const msg = err?.message || "Upload error";
  // Common Multer errors:
  // - LIMIT_FILE_SIZE
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: "File too large (max 10MB)" });
  }
  if (msg.toLowerCase().includes("invalid file type")) {
    return res.status(400).json({ error: "Invalid file type" });
  }
  return res.status(400).json({ error: msg });
});

module.exports = router;
