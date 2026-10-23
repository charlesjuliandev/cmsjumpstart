
import {
  draftMode
} from "next/headers";

import {
  createErrorResponse,
  getPreviewPath,
  hasAllowedOrigin,
  hasCredentialQueryParameter,
  readRequestFields,
  validateAllowedOrigin
} from "./previewSecurity.js";

export interface ExitPreviewHandlerOptions {
  allowedOrigin: string;
}

export function createExitPreviewHandler(
  options: ExitPreviewHandlerOptions
) {
  const allowedOrigin = validateAllowedOrigin(
    options.allowedOrigin
  );

  return async function exitPreviewHandler(
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

    let path = "/";

    if (request.body !== null) {
      const body = await readRequestFields(request);

      if (!body) {
        return createErrorResponse(
          "Invalid exit-preview request body.",
          400
        );
      }

      if ("path" in body) {
        const validatedPath = getPreviewPath(body.path);

        if (!validatedPath) {
          return createErrorResponse(
            "Invalid redirect path.",
            400
          );
        }

        path = validatedPath;
      }
    }

    const mode = await draftMode();

    mode.disable();

    return new Response(null, {
      status: 303,
      headers: {
        Location: path,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Content-Type-Options": "nosniff"
      }
    });
  };
}
