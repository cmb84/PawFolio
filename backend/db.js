const mysql = require("mysql2/promise");

// Support both DB_PASSWORD and DB_PASS (some deploys use DB_PASS)
const DB_HOST = process.env.DB_HOST;
const DB_USER = process.env.DB_USER;
const DB_PASSWORD = process.env.DB_PASSWORD ?? process.env.DB_PASS;
const DB_NAME = process.env.DB_NAME;
const DB_PORT = process.env.DB_PORT;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.warn(
    "[db] Missing DB_* env vars. Set DB_HOST, DB_USER, DB_PASSWORD (or DB_PASS), DB_NAME."
  );
}

const pool = mysql.createPool({
  host: DB_HOST || "localhost",
  port: DB_PORT ? Number(DB_PORT) : 3306,
  user: DB_USER || "root",
  password: DB_PASSWORD || "",
  database: DB_NAME || "",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
