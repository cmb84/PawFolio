import dotenv from "dotenv";
dotenv.config();

import mysql from "mysql2/promise";

async function test() {
  try {
    console.log("Resolving host:", process.env.DB_HOST);

    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
    });

    console.log("DB CONNECTED!");

    const [rows] = await conn.query("SELECT 1 AS test");
    console.log("QUERY SUCCESS:", rows);
    conn.end();
  } catch (err) {
    console.error("DB TEST ERROR:", err);
  }
}

test();

