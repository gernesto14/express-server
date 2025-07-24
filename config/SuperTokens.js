// config/SuperTokens.js

import supertokens from "supertokens-node";
import Session from "supertokens-node/recipe/session";

export const InitSupertokens = () => {
  supertokens.init({
    // debug: true,
    framework: "express",
    supertokens: {
      connectionURI: `${process.env.SUPERTOKENS_CONNECTION_URI}`,
      apiKey: `${process.env.SUPERTOKENS_API_KEY}`,
    },
    appInfo: {
      // learn more about this on https://supertokens.com/docs/session/appinfo
      appName: "Microservice Supertokens",
      apiDomain: `${process.env.SUPERTOKENS_API_DOMAIN}`,
      websiteDomain: `${process.env.SUPERTOKENS_WEBSITE_DOMAIN}`,
      apiBasePath: "/auth",
      // websiteBasePath: "/auth",
    },
    recipeList: [
      Session.init(), // initializes session features
    ],
  });
};
