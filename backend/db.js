const mysql = require("mysql2/promise");

const pool = mysql.createPool({
  host: "pawfolio-db.cd0kswsqgr4e.us-east-2.rds.amazonaws.com",
  user: "admin",
  password: "pawfolio123!",
  database: "pawfolio",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;

