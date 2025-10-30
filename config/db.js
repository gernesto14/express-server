// src: ./config/db.js

import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

// Load .env.dev in development mode
if (process.env.NODE_ENV === "development") {
  dotenv.config({ path: ".env.dev" });
  console.log("Development mode: Loaded .env.dev file");
} else if (process.env.NODE_ENV === "production") {
  dotenv.config({ path: ".env.prod" });
  console.log("Production mode: Loaded .env.prod file");
} else if (process.env.NODE_ENV === "stage") {
  dotenv.config({ path: ".env.stage" });
  console.log("Stage mode: Loaded .env.stage file");
}

const connectionString =
  process.env.DATABASE_URL || process.env.EXTERNAL_DB_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is missing!");
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  // ssl:
  //   process.env.NODE_ENV === "production"
  //     ? { rejectUnauthorized: false } // required for cloud dbs
  //     : false,
  // Optional tuning:
  // max: 10,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
});

// Connection logs
pool.on("connect", () => console.log("🟢 DB connected"));
pool.on("acquire", () => console.log("🔄 Connection acquired"));
pool.on("remove", () => console.log("🛑 Connection released"));
pool.on("error", (err) => console.error("🔥 Unexpected DB error", err));

export default pool;
