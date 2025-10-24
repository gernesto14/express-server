import UserMetadata from "supertokens-node/recipe/usermetadata";
import validator from "validator";
// import pool from "../db.js";
// import { deleteUser } from "supertokens-node"; // Ensure this is imported

// Flow for signing up a new user
export async function flowSignUpPOST(input, originalImplementation) {
  console.log("ℹ️ Custom signUpPOST called");

  // Check if input and originalImplementation are provided
  if (!input || !originalImplementation) {
    throw new Error(
      "❌ Input or originalImplementation missing in flowSignUpPOST"
    );
  }

  // Check if form fields are provided
  if (!input.formFields) {
    throw new Error("Form fields are missing in flowSignUpPOST");
  }
  // Check if userContext is provided
  if (!input.userContext) {
    throw new Error("User context is missing in flowSignUpPOST");
  }

  try {
    console.log("--- flowSingUpPOST ---");

    // Validate the access code
    const validatedFormFields = await validateFormFields(input.formFields);

    // If the form fields are invalid, throw an error and stop the sign-up process
    if (!validatedFormFields) throw new Error("Invalid form fields");

    // console.log("--- flowSingUpPOST ---");

    console.log("\nValidated form fields: ", validatedFormFields);

    // If validation returned a FIELD_ERROR object, bubble it up
    if (validatedFormFields?.status === "FIELD_ERROR") {
      return validatedFormFields;
    }

    if (!validatedFormFields) {
      return {
        status: "FIELD_ERROR",
        formFields: [{ id: "access_code", error: "Invalid form fields" }],
      };
    }

    if (originalImplementation.signUpPOST === undefined) {
      throw Error("❌ Should never come here");
    }

    // First we call the original implementation of signUpPOST.
    const response = await originalImplementation.signUpPOST(input);

    if (!response) {
      throw new Error("Response is missing in flowSignUpPOST");
    }

    // Post sign up response, we check if it was successful
    if (response.status === "OK") {
      console.log("\n✅ User signed up successfully:", response.user.id);
      const userId = response.user.id;
      const access_code = input.formFields[4].value;

      // LOG NEW USER SIGNUP AND THE USER ID
      console.log("New user signed up:", userId);
      console.log("Access code:", access_code);
      console.log("User ID:", userId);

      // Update user metadata
      await updateMetadata(userId, validatedFormFields);
    }

    console.log("\n✅ Sign up response:", response.status);
    return response;
  } catch (error) {
    throw new Error("\n❌ Error in flowSignUpPOST: " + error.message);
  }
}

// Assign new user to a tenant
export async function assignUserToTenant(accessCode, userId) {
  console.log("Assigning user to tenant: ", userId);
  if (!userId || !accessCode) {
    console.error("User ID and access code are required");
    throw new Error("User ID is required");
  }
  try {
    // Define the tenantId variable
    let tenantId;

    console.log("Assigning user to tenant with access code: ", accessCode);

    const trimmedCode = accessCode.trim().slice(0, 10);

    console.log("Trimmed access code: ", trimmedCode);

    // Check if the access code is "DEMO"
    if (accessCode === "DEMO") {
      // Always assign to the DEMO tenant (static UUID or fetch it by name)
      const demoQuery = `SELECT tenant_id FROM tenants WHERE access_code LIKE 'DEMO' LIMIT 1`;
      const demoResult = await pool.query(demoQuery);

      // console.log("Demo tenant result: ", demoResult);

      if (demoResult.rowCount === 0) {
        throw new Error("Demo tenant not found");
      }

      tenantId = demoResult.rows[0].tenant_id;
    } else {
      // Check access code validity and expiration
      const accessCodeQuery = `
        SELECT tac.code_id, tac.tenant_id, tac.expires_at
        FROM tenant_access_codes tac
        WHERE tac.access_code = $1 AND tac.is_active = true AND tac.expires_at > NOW()
        LIMIT 1;
      `;

      const { rows } = await pool.query(accessCodeQuery, [trimmedCode]);

      console.log("--- assignUserToTenant");

      if (rows.length === 0) {
        throw new Error("Access code is invalid, expired, or inactive");
      }
      tenantId = rows[0].tenant_id;
      const codeId = rows[0].code_id;

      // Update tenant_access_codes: set is_active = false, append user_id to used_by
      await pool.query(
        `
        UPDATE tenant_access_codes 
        SET is_active = false, current_uses = current_uses + 1, 
            used_by = array_append(used_by, $1), updated_at = NOW()
        WHERE code_id = $2
        `,
        [userId, codeId]
      );
    }

    console.log("--- assignUserToTenant 151");

    // Insert into user_tenants
    const queryInsert = `
        INSERT INTO user_tenants (user_id, tenant_id, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `;
    const result = await pool.query(queryInsert, [userId, tenantId]);

    if (result.rowCount === 0) {
      throw new Error("Failed to assign user to tenant");
    }

    console.log(`User ${userId} assigned to tenant ${tenantId}`);

    return tenantId;
  } catch (error) {
    console.error("Error assigning user to tenant: ", error.message);
    try {
      console.log(`Cleaning up user ${userId}`);
      await deleteUser(userId);
    } catch (deleteErr) {
      console.error(
        "Failed to delete user during rollback:",
        deleteErr.message
      );
    }
    throw error;
  }
}

// Validate the form fields and return cleaned form fields as an object.
export function validateFormFields(formFields) {
  // Example formFields:
  //   formFields:  [
  //   { id: 'email', value: 'sckjnssdasc@email.com' },
  //   { id: 'password', value: 'lksndc2389' },
  //   { id: 'first_name', value: 'kjandc' },
  //   { id: 'last_name', value: 'sjndc' },
  //   { id: 'access_code', value: 'DEMO' }
  //   { id: 'company_name', value: 'asdasd' },
  //   { id: 'terms', value: 'true' }
  // ]

  // console.log("Validating form fields: ", formFields);

  // Check that email is valid
  if (!validator.isEmail(formFields[0].value)) {
    throw new Error("❌Invalid email");
  }

  const accessCode = formFields.find((f) => f.id === "access_code")?.value;

  // Check that access code is provided
  if (!accessCode || accessCode.toLowerCase() !== "demo") {
    console.warn(`❌ Invalid access code attempted: ${accessCode}`);

    return {
      status: "FIELD_ERROR",
      formFields: [
        {
          id: "access_code",
          error: "Invalid or expired code. Please check with your admin.",
        },
      ],
    };
  }

  // Check that company name is provided or empty, could make it optional
  const companyName = formFields.find((f) => f.id === "company_name")?.value;
  if (companyName && companyName.length > 100) {
    throw new Error("❌ Company name is too long");
  }

  // Check that terms is accepted
  if (formFields[6].value !== "true") {
    throw new Error("❌ Terms must be accepted");
  }

  // Capitalize and validate name fields
  formFields.forEach((field) => {
    if (field.id === "first_name" || field.id === "last_name") {
      // Capitalize the first letter and make the rest lowercase
      field.value =
        field.value.charAt(0).toUpperCase() +
        field.value.slice(1).toLowerCase();
      if (!validator.isAlpha(field.value)) {
        throw new Error("❌ Invalid name");
      }
    }
  });

  // Return cleaned fields as an object
  return formFields.reduce((acc, field) => {
    acc[field.id] = field.value;
    return acc;
  }, {});
}

// Add the user's first name and last name to the user metadata.
export async function updateMetadata(userId, formFields) {
  console.log("Updating metadata for user: ", userId);

  if (!userId || !formFields) {
    // console.error("User ID and form fields are required");
    throw new Error("❌ User ID and form fields are required");
  }
  // Extract first name and last name from form fields
  const { first_name, last_name, email, access_code, company_name } =
    formFields;

  try {
    // Update the user metadata
    const result = await UserMetadata.updateUserMetadata(userId, {
      first_name,
      last_name,
      email,
      access_code,
      company_name,
    });

    console.log(`✅ Metadata updated userId(${userId}) `, result);
  } catch (error) {
    console.error("❌ Error updating metadata: ", error.message);
  }
}
