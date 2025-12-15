const mysql = require("mysql2/promise");

async function main() {
  try {
    console.log("🔌 Connecting to DB...");

    const conn = await mysql.createConnection({
      host: "pawfolio-db.cd0kswsqgr4e.us-east-2.rds.amazonaws.com",
      user: "admin",
      password: "pawfolio123!",
      database: "pawfolio"
    });

    console.log("✅ Connected!");

    const username = "insert_test";
    const email = "insert_test@test.com";

    console.log("📝 Attempting INSERT...");
    const [result] = await conn.execute(
      "INSERT INTO users(username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, "FAKE_HASH"]
    );

    console.log("🎉 INSERT SUCCESS!");
    console.log(result);

    await conn.end();
  } catch (err) {
    console.error("❌ INSERT ERROR:", err);
  }
}

main();
