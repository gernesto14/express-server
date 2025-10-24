import Session from "supertokens-node/recipe/session";
import supertokens from "supertokens-node";
import UserMetadata from "supertokens-node/recipe/usermetadata";
// import pool from "../db.js";
// import { getOrCreateTenantJWT, maybeCleanupOldTenantJWTs } from "./tenant.js";

// Function to get the tenant JWT for a user
export async function getUserTenantToken(userId) {
  console.log("Function getUserTenantToken User ID:", userId);

  try {
    // Get tenant_id for the user
    // const query = `SELECT tenant_id FROM user_tenants WHERE user_id = $1`;
    // const { rows: tenantRows } = await pool.query(query, [userId]);

    // Get tenant_id for the user
    const query = `
  SELECT tenant_id, updated_at
  FROM user_tenants
  WHERE user_id = $1
    `;
    const { rows: tenantRows } = await pool.query(query, [userId]);

    console.log("Tenant rows found:", tenantRows);

    if (tenantRows.length === 0) {
      throw new Error(`No tenant found for user ID: ${userId}`);
    }

    if (tenantRows.length > 1) {
      console.warn(
        `[WARNING] Multiple tenant assignments found for user: ${userId}`
      );
      console.table(tenantRows);
    }

    const tenantId = tenantRows[0].tenant_id;
    console.log("Tenant ID: ", tenantId);

    // 🔁 Always get or create a valid tenant JWT
    const tenantJwt = await getOrCreateTenantJWT(tenantId);

    // 🧼 Optionally cleanup old JWTs in background
    maybeCleanupOldTenantJWTs().catch((err) =>
      console.error("Cleanup error:", err.message)
    );

    return tenantJwt;
  } catch (error) {
    console.error("Error getting user tenant token:", error);
    throw error;
  }
}

// Function to log the last 100 login times
export async function logUserLoginTime(userId, reqLike) {
  try {
    // Step 1: Fetch the current metadata for the user
    const { metadata } = await UserMetadata.getUserMetadata(userId);

    //   log metadata to console
    if (!metadata) {
      console.warn("❌ No metadata found for user:", userId);
    }
    console.log("\nℹ️ Current metadata:", metadata);

    // Step 2: Get the current login times or initialize an empty array if not present
    let loginTimes = metadata.loginTimes || [];

    // Try every known spot where SuperTokens can expose request info
    const expressReq =
      reqLike?.original || // ExpressRequest wrapper
      reqLike?.request || // fallback property
      reqLike || // maybe already the raw req
      null;

    // Safely read headers and socket
    const headers = expressReq?.headers || {};
    const ipAddress =
      headers["x-forwarded-for"]?.split(",")[0] ||
      expressReq?.socket?.remoteAddress ||
      "unknown";
    const userAgent = headers["user-agent"] || "unknown";
    const now = new Date();

    // Step 3: Add the new login time
    loginTimes.push({
      userId,
      serverTimeUTC: now.toISOString(),
      serverTimeNY: now.toLocaleString("en-US", {
        timeZone: "America/New_York",
        hour12: false, // optional, remove if you want AM/PM
      }),
      ip: ipAddress,
      userAgent,
    });

    // Step 4: Ensure the list contains only the last 100 login times
    if (loginTimes.length > 100) {
      loginTimes = loginTimes.slice(-100);
    }

    // Step 5: Update the user metadata with the new list of login times
    await UserMetadata.updateUserMetadata(userId, { loginTimes });

    console.log(`\n✅ Updated login times for user ${userId}:`, loginTimes);
  } catch (error) {
    console.error("\n\n❌ Error logging user login:", error);
  }
}

// Function to log user information
export async function userInfo(userId) {
  console.log("Function userInfo User ID:");
  const getUserInfo = await supertokens.getUser(userId);
  const { metadata } = await UserMetadata.getUserMetadata(userId);

  // Convert timeJoined to human-readable format
  const timeJoined = new Date(getUserInfo.timeJoined).toLocaleString();

  console.log("User info:", getUserInfo);
  console.log("User metadata:", metadata.loginTimes);
  console.log("User joined:", timeJoined);
}

// Function to remove sessions older than the latest session (revoke all others)
// export async function removeOldSessions(userId) {
//   console.log("Function removeOldSessions User ID:", userId);

//   // 1) Fetch all existing sessions for the user
//   const sessionHandles = await Session.getAllSessionHandlesForUser(userId);
//   if (!sessionHandles || sessionHandles.length <= 1) {
//     return sessionHandles ? sessionHandles.length : 0; // nothing to do
//   }

//   // 2) Fetch session info (guard against null/expired)
//   const sessionDetailsRaw = await Promise.all(
//     sessionHandles.map(async (handle) => {
//       const info = await Session.getSessionInformation(handle);
//       return info
//         ? { sessionHandle: handle, creationTime: info.timeCreated }
//         : null;
//     })
//   );
//   const sessionDetails = sessionDetailsRaw.filter(Boolean);

//   // If after filtering there's <= 1, nothing to revoke
//   if (sessionDetails.length <= 1) {
//     return (await Session.getAllSessionHandlesForUser(userId)).length;
//   }

//   // 3) Sort by creation time (newest first)
//   sessionDetails.sort((a, b) => b.creationTime - a.creationTime);

//   // 4) Revoke all except the newest one
//   const sessionsToRemove = sessionDetails.slice(1);
//   await Promise.all(
//     sessionsToRemove.map((s) => Session.revokeSession(s.sessionHandle))
//   );

//   console.log("\nStep 5");
//   // 5) Return the post-cleanup count
//   const remaining = await Session.getAllSessionHandlesForUser(userId);
//   console.log(
//     `\nℹ️ Removed ${sessionsToRemove.length} old sessions for user ${userId}. \nRemaining sessions:`,
//     remaining
//   );
//   return remaining.length; // should be 1
// }
