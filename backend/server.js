const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const authRoutes = require("./routes/auth");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

app.use(
  cors({
    origin: "*",
  })
);

app.use("/api/auth", authRoutes);

app.get("/api/health", (req, res) => {
  res.json({ ok: true, status: "PawFolio backend running" });
});

app.listen(PORT, () => {
  console.log(`PawFolio backend listening on port ${PORT}`);
});

