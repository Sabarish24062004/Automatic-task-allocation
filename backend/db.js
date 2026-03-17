const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "task_system",
  password: "987654321",
  port: 5432,
});

module.exports = pool;