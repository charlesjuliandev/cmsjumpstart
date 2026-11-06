
import {
  draftMode
} from "next/headers";

import {
  createErrorResponse,
  getPreviewPath,
  hasAllowedOrigin,
  validateAllowedOrigin
} from "./previewSecurity.js";

export interface NativePreviewHandlerOptions {
  redemptionUrl: string;
  secret: string;
  drupalOrigin: string;
}

export function createNativePreviewHandler(
  options: NativePreviewHandlerOptions
) {
  const secret = options.secret.trim();

  if (!secret) {
    throw new Error(
      "A native preview secret is required."
    );
  }

  const drupalOrigin = validateAllowedOrigin(
    options.drupalOrigin
  );

  let redemptionUrl: URL;

  try {
    redemptionUrl = new URL(options.redemptionUrl);

    if (
      redemptionUrl.origin !== drupalOrigin ||
      redemptionUrl.username ||
      redemptionUrl.password ||
      redemptionUrl.search ||
      redemptionUrl.hash
    ) {
      throw new Error();
    }
  } catch {
    throw new Error(
      "The redemption URL must be an absolute URL on the configured Drupal origin, without credentials, query parameters, or a fragment."
    );
  }

  return async function nativePreviewHandler(
    request: Request
  ): Promise<Response> {
    if (request.method !== "POST") {
      return createErrorResponse(
        "Method not allowed.",
        405,
        { Allow: "POST" }
      );
    }

    const requestUrl = new URL(request.url);

    if (
      requestUrl.search ||
      requestUrl.hash
    ) {
      return createErrorResponse(
        "Do not send preview credentials in the URL.",
        400
      );
    }

    if (!hasAllowedOrigin(request, drupalOrigin)) {
      return createErrorResponse(
        "Invalid Drupal preview origin.",
        403
      );
    }

    const contentType =
      request.headers.get("content-type") ?? "";

    const mediaType = contentType
      .split(";", 1)[0]
      ?.trim()
      .toLowerCase();

    if (
      mediaType !== "application/x-www-form-urlencoded" &&
      mediaType !== "application/json"
    ) {
      return createErrorResponse(
        "A preview ticket is required.",
        400
      );
    }

    let body: Record<string, unknown> | null = null;

    try {
      if (mediaType === "application/json") {
        const parsed: unknown = await request.json();

        if (
          typeof parsed === "object" &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          body = parsed as Record<string, unknown>;
        }
      } else {
        const form = await request.formData();
        const ticket = form.get("ticket");

        body = { ticket };
      }
    } catch {
      return createErrorResponse(
        "Invalid preview request body.",
        400
      );
    }

    const ticket = body?.ticket;

    if (
      typeof ticket !== "string" ||
      !/^[a-f0-9]{64}$/.test(ticket)
    ) {
      return createErrorResponse(
        "A valid preview ticket is required.",
        400
      );
    }

    let redemptionResponse: Response;

    try {
      redemptionResponse = await fetch(
        redemptionUrl,
        {
          method: "POST",
          redirect: "error",
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${secret}`,
            "Content-Type": "application/json",
            Accept: "application/json"
          },
          body: JSON.stringify({ ticket })
        }
      );
    } catch (error) {
      console.error(
        "[native-preview] Drupal redemption fetch failed:",
        error instanceof Error ? error.message : "Unknown error",
        error instanceof Error && "cause" in error
          ? error.cause
          : undefined
      );

      return createErrorResponse(
        "Unable to validate the Drupal preview ticket.",
        502
      );
    }

    if (!redemptionResponse.ok) {
      console.error(
        "[native-preview] Drupal redemption returned HTTP status:",
        redemptionResponse.status
      );

      return createErrorResponse(
        "The Drupal preview ticket is invalid, expired, or already used.",
        401
      );
    }

    let redemption: unknown;

    try {
      redemption = await redemptionResponse.json();
    } catch (error) {
      console.error(
        "[native-preview] Drupal redemption response was not valid JSON:",
        error instanceof Error ? error.message : "Unknown error"
      );

      return createErrorResponse(
        "Invalid Drupal preview response.",
        502
      );
    }

    if (
      typeof redemption !== "object" ||
      redemption === null ||
      !("path" in redemption)
    ) {
      console.error(
        "[native-preview] Drupal redemption response is missing its path."
      );

      return createErrorResponse(
        "Invalid Drupal preview response.",
        502
      );
    }

    const path = getPreviewPath(
      (redemption as { path: unknown }).path
    );

    if (!path) {
      console.error(
        "[native-preview] Drupal returned an invalid preview destination."
      );

      return createErrorResponse(
        "Drupal returned an invalid preview destination.",
        502
      );
    }

    const mode = await draftMode();

    mode.enable();

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
