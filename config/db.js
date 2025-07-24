// config/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.EXTERNAL_DB_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  // max: 10, // Optional: adjust for concurrency
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});

pool.on("connect", () => console.log("🟢 DB connected"));
pool.on("acquire", () => console.log("🔄 Connection acquired"));
pool.on("remove", () => console.log("🛑 Connection released"));
pool.on("error", (err) => console.error("🔥 Unexpected DB error", err));

export default pool;
