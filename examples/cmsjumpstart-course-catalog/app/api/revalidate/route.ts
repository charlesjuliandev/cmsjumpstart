import {
  createRevalidationHandler
} from "@cmsjumpstart/next";

function getRevalidationSecret(): string {
  const secret =
    process.env
      .CMSJUMPSTART_REVALIDATION_SECRET
      ?.trim();

  if (!secret) {
    throw new Error(
      "Missing required environment variable: CMSJUMPSTART_REVALIDATION_SECRET"
    );
  }

  return secret;
}

export const POST =
  createRevalidationHandler({
    secret:
      getRevalidationSecret()
  });

