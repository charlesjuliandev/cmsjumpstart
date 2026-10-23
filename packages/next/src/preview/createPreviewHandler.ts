
import {
  draftMode
} from "next/headers";

import {
  createErrorResponse,
  hasAllowedOrigin,
  hasCredentialQueryParameter,
  readRequestFields,
  validateAllowedOrigin,
  verifyPreviewToken
} from "./previewSecurity.js";

export interface PreviewHandlerOptions {
  secret: string;
  allowedOrigin: string;
}

export function createPreviewHandler(
  options: PreviewHandlerOptions
) {
  const secret = options.secret.trim();

  if (!secret) {
    throw new Error(
      "A preview secret is required."
    );
  }

  const allowedOrigin = validateAllowedOrigin(
    options.allowedOrigin
  );

  return async function previewHandler(
    request: Request
  ): Promise<Response> {
    if (request.method !== "POST") {
      return createErrorResponse(
        "Method not allowed.",
        405,
        { Allow: "POST" }
      );
    }

    if (hasCredentialQueryParameter(request)) {
      return createErrorResponse(
        "Do not send preview credentials in the URL.",
        400
      );
    }

    if (!hasAllowedOrigin(request, allowedOrigin)) {
      return createErrorResponse(
        "Invalid preview request origin.",
        403
      );
    }

    const body = await readRequestFields(request);

    if (!body || !("token" in body)) {
      return createErrorResponse(
        "A valid preview token is required.",
        400
      );
    }

    const path = verifyPreviewToken(
      body.token,
      secret
    );

    if (!path) {
      return createErrorResponse(
        "Invalid or expired preview token.",
        401
      );
    }

    const mode = await draftMode();

    mode.enable();

   return new Response(null, {
      status: 303,
      headers: {
        Location: path,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer"
      }
    });
  };
}
