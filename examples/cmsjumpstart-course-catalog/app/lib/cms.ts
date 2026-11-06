
import { createNextCMS } from "@cmsjumpstart/next";

const requiredEnv = [
  "DRUPAL_BASE_URL",
  "DRUPAL_USERNAME",
  "DRUPAL_PASSWORD",
] as const;

for (const name of requiredEnv) {
  if (!process.env[name]?.trim()) {
    throw new Error(
      `Missing required environment variable: ${name}`,
    );
  }
}

const baseUrl = process.env.DRUPAL_BASE_URL!;
const username = process.env.DRUPAL_USERNAME!;
const password = process.env.DRUPAL_PASSWORD!;

const consumerUuid = process.env.CONSUMERUUID?.trim();
const apiKey = process.env.API_KEY?.trim();

const headers: Record<string, string> = {};

if (consumerUuid) {
  headers["X-Consumer-ID"] = consumerUuid;
}

if (apiKey) {
  headers["api-key"] = apiKey;
}

export const cms = createNextCMS({
  drupal: {
    baseUrl,
    auth: {
      type: "basic",
      username,
      password,
    },
    ...(Object.keys(headers).length > 0 ? { headers } : {}),
  },
});
