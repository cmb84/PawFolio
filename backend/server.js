const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

const authRoutes = require("./routes/auth");
const uploadRoutes = require("./routes/upload");

dotenv.config();

const app = express();
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

app.use(express.json());

// CORS
const origins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: origins.length ? origins : "*",
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);

// Serve uploaded files
const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "PawFolio backend running" });
});

app.listen(PORT, () => {
  console.log(`PawFolio backend listening on port ${PORT}`);
});
