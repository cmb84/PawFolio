require("dns").setServers(["10.0.0.2"]);

const mysql = require("mysql2/promise");

async function test() {
  console.log("Trying DB connection...");

  try {
    const conn = await mysql.createConnection({
      host: "pawfolio-db.cd0kswsqgr4e.us-east-2.rds.amazonaws.com",
      user: "admin",
      password: "pawfolio123!",
      database: "pawfolio"
    });

    console.log("CONNECTED!");
    await conn.end();
  } catch (err) {
    console.error("DB ERROR:", err);
  }
}

test();
