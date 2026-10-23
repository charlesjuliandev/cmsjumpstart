
import {
  createPreviewToken,
  createErrorResponse,
  getPreviewPath,
  hasCredentialQueryParameter,
  safeStringEqual,
  previewTokenLifetimeSeconds
} from "./previewSecurity.js";

export interface PreviewTokenHandlerOptions {
  secret: string;
}

export function createPreviewTokenHandler(
  options: PreviewTokenHandlerOptions
) {
  const secret = options.secret.trim();

  if (!secret) {
    throw new Error(
      "A preview secret is required."
    );
  }

  return async function previewTokenHandler(
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

    const authorization =
      request.headers.get("authorization");

    const bearerMatch = authorization?.match(
      /^Bearer\s+(\S+)$/i
    );

    if (
      !bearerMatch ||
      !safeStringEqual(
        bearerMatch[1]!,
        secret
      )
    ) {
      return createErrorResponse(
        "Invalid preview secret.",
        401
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return createErrorResponse(
        "A valid JSON request body is required.",
        400
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      Array.isArray(body) ||
      !("path" in body)
    ) {
      return createErrorResponse(
        "A valid preview path is required.",
        400
      );
    }

    const path = getPreviewPath(body.path);

    if (!path) {
      return createErrorResponse(
        "A valid preview path is required.",
        400
      );
    }

    const expiresAt =
      Math.floor(Date.now() / 1000) +
      previewTokenLifetimeSeconds;

    const token = createPreviewToken(
      secret,
      path,
      expiresAt
    );

    return Response.json(
      {
        token,
        expiresAt,
        path
      },
      {
        headers: {
          "Cache-Control": "no-store",
          "Referrer-Policy": "no-referrer",
          "X-Content-Type-Options": "nosniff"
        }
      }
    );
  };
}
