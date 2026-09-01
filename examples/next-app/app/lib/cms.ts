import {
  createNextCMS
} from "@cmsjumpstart/next";

function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

const drupalBaseUrl =
  getRequiredEnv(
    "DRUPAL_BASE_URL"
  );

const htauthUsername =
  getRequiredEnv(
    "HTAUTH_U"
  );

const htauthPassword =
  getRequiredEnv(
    "HTAUTH_P"
  );

const consumerUuid =
  getRequiredEnv(
    "CONSUMERUUID"
  );

const apiKey =
  getRequiredEnv(
    "UP_API_KEY"
  );

export const cms =
  createNextCMS({
    drupal: {
      baseUrl:
        drupalBaseUrl,

      auth: {
        type: "basic",

        username:
          htauthUsername,

        password:
          htauthPassword
      },

      headers: {
        "X-Consumer-ID":
          consumerUuid,

        "api-key":
          apiKey
      }
    }
  });

