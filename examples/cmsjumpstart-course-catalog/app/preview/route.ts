import {
  createPreviewHandler
} from "@cmsjumpstart/next";

function getPreviewSecret(): string {
  const secret =
    process.env
      .CMSJUMPSTART_PREVIEW_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Missing required environment variable: CMSJUMPSTART_PREVIEW_SECRET"
    );
  }

  return secret;
}

export const GET =
  createPreviewHandler({
    secret:
      getPreviewSecret()
  });