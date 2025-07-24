// utils/tenantDbClient.js
import pool from "../config/db.js";

export async function getTenantDbClient(tenantId) {
  if (!tenantId || tenantId === "") {
    throw new Error("Missing tenantId");
  }

  console.log("getTenantDbClient --- tenantId", tenantId);

  const client = await pool.connect();

  try {
    await client.query(`SET app.tenant_id = '${tenantId}'`);
  } catch (err) {
    client.release();
    throw new Error("Failed to set tenant context: " + err.message);
  }

  return {
    query: (...args) => client.query(...args),
    release: () => client.release(),
    raw: client,
  };
}
