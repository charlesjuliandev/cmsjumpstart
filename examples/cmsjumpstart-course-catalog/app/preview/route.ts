
import {
  createPreviewHandler
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

export const POST = createPreviewHandler({
  secret: getRequiredEnv(
    "CMSJUMPSTART_PREVIEW_SECRET"
  ),
  allowedOrigin: getRequiredEnv(
    "CMSJUMPSTART_PREVIEW_ALLOWED_ORIGIN"
  )
});
