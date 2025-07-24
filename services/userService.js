// services/userService.js

import pool from "../config/db.js";

export const getAllUsers = async () => {
  const res = await pool.query("SELECT * FROM users");
  return res.rows;
};

export const createUser = async ({ name, email }) => {
  const res = await pool.query(
    "INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *",
    [name, email]
  );
  return res.rows[0];
};
