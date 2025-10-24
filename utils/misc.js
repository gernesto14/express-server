import {
  UserRoleClaim,
  PermissionClaim,
} from "supertokens-node/recipe/userroles";
import UserRoles from "supertokens-node/recipe/userroles";
import EmailVerification from "supertokens-node/recipe/emailverification";
import supertokens, { getUsersNewestFirst, deleteUser } from "supertokens-node";
import crypto from "crypto";

export async function deleteAllUnverifiedUsers() {
  try {
    console.log("Deleting unverified users...");

    // Get all unverified users
    const { users } = await getUsersNewestFirst({
      tenantId: "public",
    });

    // User {
    //   id: '2ef3b64c-c71d-4f3c-9e6b-a894b2356302',
    //   isPrimaryUser: false,
    //   tenantIds: [Array],
    //   emails: [Array],
    //   phoneNumbers: [],
    //   thirdParty: [],
    //   timeJoined: 1739570098138,
    //   loginMethods: [Array]
    // },

    // Loop through the users and check their email verification status
    users.map(async (user) => {
      const email = user.emails[0].email; // Assuming the first email is the primary email
      const recipeUserId = { getAsString: () => user.id }; // Ensure recipeUserId has getAsString method

      // Check if the user is verified
      const isVerified = await EmailVerification.isEmailVerified(
        recipeUserId,
        email
      );

      console.log("User is verified: ", isVerified);

      // If the email is not verified, delete the user
      if (!isVerified) {
        await deleteUser(user.id);
        console.log(`Deleted user with ID: ${user.id}`);
      }
    });
  } catch (error) {
    console.error("Error deleting unverified users:", error.message);
  }
}

export async function createRoles() {
  try {
    await UserRoles.createNewRoleOrAddPermissions("admin", [
      "read",
      "write",
      "delete",
    ]);
    await UserRoles.createNewRoleOrAddPermissions("user", ["read"]);
    console.log("Roles created successfully");
  } catch (error) {
    console.error("Error creating roles:", error);
  }
}

// Function to add roles and permissions to a user's session
export async function addRolesAndPermissionsToSession(session) {
  // we add the user's roles to the user's session
  await session.fetchAndSetClaim(UserRoleClaim);

  // we add the permissions of a user to the user's session
  await session.fetchAndSetClaim(PermissionClaim);
}

// Function to remove a role from a user
export async function removeRoleFromUserAndTheirSession(session) {
  const response = await UserRoles.removeUserRole(
    session.getTenantId(),
    session.getUserId(),
    "user"
  );

  if (response.status === "UNKNOWN_ROLE_ERROR") {
    // No such role exists
    return;
  }

  if (response.didUserHaveRole === false) {
    // The user was never assigned the role
  } else {
    // We also want to update the session of this user to reflect this change.
    await session.fetchAndSetClaim(UserRoles.UserRoleClaim);
    await session.fetchAndSetClaim(UserRoles.PermissionClaim);
  }
}

// Function to get all roles assigned to a user
export async function getRolesForUser(userId) {
  const { roles } = await UserRoles.getRolesForUser("public", userId);

  if (roles.length === 0) {
    // The user has no roles assigned
    console.log("No roles assigned to user: ", userId);
  }

  return roles;
}

// Function to get all users that have a specific role
async function getUsersThatHaveRole(role) {
  const response = await UserRoles.getUsersThatHaveRole("public", role);

  if (response.status === "UNKNOWN_ROLE_ERROR") {
    // No such role exists
    return;
  }

  const users = response.users;
}

// Function to add a role to a user
export async function addRoleToUser(userId, role) {
  const response = await UserRoles.addRoleToUser("public", userId, role);

  if (response.status === "UNKNOWN_ROLE_ERROR") {
    // No such role exists
    console.log("No such role exists");
    return;
  }

  if (response.didUserAlreadyHaveRole === false) {
    // The user was successfully assigned the role
    console.log("Role added to user");

    // Fetch the user's session
    const session = await Session.getSession(req, res);

    // Update the session to reflect the new role
    await session.fetchAndSetClaim(UserRoles.UserRoleClaim);
    await session.fetchAndSetClaim(UserRoles.PermissionClaim);
  } else {
    // The user already had the role
    console.log("User already had the role");
  }
}
// Mark an email as unverified
// First get the userId
export async function manuallyUnverifyEmail(recipeUserId) {
  try {
    // Set email verification status to false
    const result = await EmailVerification.unverifyEmail(recipeUserId);
    if (result.status === "EMAIL_VERIFICATION_INVALID_USER_ID_ERROR") {
      console.log("Invalid user ID");
    }
    return result;
  } catch (err) {
    console.error(err);
  }
}

export function generateApiKey() {
  const apiKey = crypto.randomBytes(32).toString("hex");
  console.log(apiKey);
}

generateApiKey();
