import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// For now, allow all origins – you can tighten this to your EC2 IP or CloudFront origin later
app.use(
  cors({
    origin: "*",
  })
);

// Mount auth routes
app.use("/api/auth", authRoutes);

// Simple health check
app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "PawFolio backend running" });
});

app.listen(PORT, () => {
  console.log(`PawFolio backend listening on port ${PORT}`);
});
