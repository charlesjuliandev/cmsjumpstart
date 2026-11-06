import {
  createNativePreviewHandler
} from "@cmsjumpstart/next";

function getRequiredEnv(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

export const POST = createNativePreviewHandler({
  secret: getRequiredEnv(
    "CMSJUMPSTART_NATIVE_PREVIEW_SECRET"
  ),
  drupalOrigin: getRequiredEnv(
    "CMSJUMPSTART_NATIVE_PREVIEW_DRUPAL_ORIGIN"
  ),
  redemptionUrl: getRequiredEnv(
    "CMSJUMPSTART_NATIVE_PREVIEW_REDEEM_URL"
  )
});