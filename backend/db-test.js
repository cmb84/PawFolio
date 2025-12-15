require("dotenv").config();
const mysql = require("mysql");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

connection.connect((err) => {
  if (err) {
    console.error("DB CONNECTION ERROR:", err);
    return;
  }
  console.log("DB CONNECTED!");

  connection.query("SELECT 1 AS result", (err, results) => {
    if (err) {
      console.error("QUERY ERROR:", err);
    } else {
      console.log("QUERY SUCCESS:", results);
    }
    connection.end();
  });
});

