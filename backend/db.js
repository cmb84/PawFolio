const mysql = require("mysql2/promise");

const {
  DB_HOST,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_PORT,
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASSWORD || !DB_NAME) {
  console.warn(
    "[db] Missing DB_* env vars. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME. (See .env.example)"
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
