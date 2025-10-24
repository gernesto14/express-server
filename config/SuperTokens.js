// ./config/SuperTokens.js
import dotenv from "dotenv";
// Load the environment variables from .env file in development mode

if (process.env.ENVIRONMENT !== "production") {
  dotenv.config({ path: ".env.dev" });
  console.log("Development mode: Loaded .env.dev file");
}
console.log("Environment:", process.env.ENVIRONMENT);
console.log("\n");

import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";
import EmailPassword from "supertokens-node/recipe/emailpassword";
import Dashboard from "supertokens-node/recipe/dashboard";
// import Passwordless from "supertokens-node/recipe/passwordless";

import EmailVerification from "supertokens-node/recipe/emailverification";
import UserMetadata from "supertokens-node/recipe/usermetadata";

import { flowSignUpPOST } from "../lib/signUp.js";
import { logUserLoginTime, userInfo } from "../lib/postLogin.js";

const apiDomain = `${process.env.SUPERTOKENS_API_DOMAIN}`;
const websiteDomain = `${process.env.SUPERTOKENS_WEBSITE_DOMAIN}`;
const connectionURI = `${process.env.SUPERTOKENS_CORE_URL}`;

console.log(
  "From ./config/SuperTokens.js Environment:",
  process.env.ENVIRONMENT
);
console.log("SuperTokens Core URL:", connectionURI);
console.log("SuperTokens Website Domain:", websiteDomain);
console.log("SuperTokens API Domain:", apiDomain);

export const initSuperTokens = () => {
  supertokens.init({
    // debug: true,
    framework: "express",
    supertokens: {
      // We use try.supertokens for demo purposes.
      // At the end of the tutorial we will show you how to create
      // your own SuperTokens core instance and then update your config.
      connectionURI: connectionURI,
      // apiKey: <YOUR_API_KEY>
    },
    appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: "ElevateAI",
      apiDomain: apiDomain,
      websiteDomain: websiteDomain,
      websiteBasePath: "/auth",
      apiBasePath: process.env.SUPERTOKENS_API_BASE_PATH,
    },
    recipeList: [
      // Passwordless.init({
      //   flowType: "MAGIC_LINK",
      //   contactMethod: "EMAIL",
      // }),
      // //////////////////////////////////////////////////////////////////////
      EmailPassword.init({
        signUpFeature: {
          formFields: [
            {
              id: "first_name",
              optional: false,
            },
            {
              id: "last_name",
              optional: false,
            },
            {
              id: "access_code",
              optional: false,
            },
            {
              id: "company_name",
              optional: true,
            },
            {
              id: "terms",
              optional: false,
            },
          ],
        },
        // Override the signup API to add custom validation
        override: {
          apis: (originalImplementation) => {
            return {
              ...originalImplementation,
              /////////////////////////////////////////////////////////////////
              // Override the signUpPOST function
              /////////////////////////////////////////////////////////////////
              signUpPOST: async function (input) {
                // Custom flow for sign up
                return await flowSignUpPOST(input, originalImplementation);
              },
              /////////////////////////////////////////////////////////////////
              // Override the Login API to add post-login logic
              signInPOST: async function (input) {
                // First we call the original implementation of signIn.
                const response = await originalImplementation.signInPOST(input);

                // Post sign up response, we check if it was successful
                if (response.status === "OK") {
                  // TODO: post sign in logic
                  try {
                    // Extract request object from SuperTokens input
                    const req = input.options.req;

                    // Log the user's login time
                    await logUserLoginTime(response.user.id, req);

                    // Log the user's information
                    await userInfo(response.user.id);
                  } catch (error) {
                    console.error(
                      `Error post-login for user: ${response.user.id}:`,
                      error
                    );
                  }
                }
                return response;
              },
            };
          },
        },
      }), // initializes signin / sign up features
      Session.init({
        cookieSecure: true, // Only secure cookies in production
        cookieSameSite: "strict", // Optionally set the SameSite policy (could be Strict, Lax, or None)
        ////////////////////////////////////////////////////////////////////////// Override session APIs
        override: {
          functions: (originalImplementation) => {
            return {
              ...originalImplementation,

              // here we are only overriding the function that's responsible
              // for creating a new session
              createNewSession: async function (input) {
                // TODO: some custom logic
                // Revoke all existing sessions for this user
                await Session.revokeAllSessionsForUser(input.userId);

                // or call the default behavior as show below
                return await originalImplementation.createNewSession(input);
              },
              // ...
              // TODO: override more functions
            };
          },
        },
      }), // initializes session features
      Dashboard.init(), // initializes SuperTokens dashboard
      EmailVerification.init({
        // This means that verifySession will now only allow calls if the user has verified their email
        mode: "REQUIRED",
      }),
      //////////////////////////////////////////////////////////////////////////// Enable user metadata
      UserMetadata.init(),
    ],
  });
};
