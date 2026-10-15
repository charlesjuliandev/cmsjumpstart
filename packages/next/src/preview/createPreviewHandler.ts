import {
  draftMode
} from "next/headers";

import {
  redirect
} from "next/navigation";

export interface PreviewHandlerOptions {
  secret: string;
}

function getPreviewPath(
  value: unknown
): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\")
  ) {
    return null;
  }

  try {
    const destination =
      new URL(
        value,
        "https://cmsjumpstart.invalid"
      );

    if (
      destination.origin !==
      "https://cmsjumpstart.invalid"
    ) {
      return null;
    }

    return value;
  } catch {
    return null;
  }
}

function createErrorResponse(
  message: string,
  status: number,
  headers?: HeadersInit
): Response {
  return new Response(
    message,
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...headers
      }
    }
  );
}

export function createPreviewHandler(
  options: PreviewHandlerOptions
) {
  const secret =
    options.secret.trim();

  if (!secret) {
    throw new Error(
      "A preview secret is required."
    );
  }

  return async function previewHandler(
    request: Request
  ): Promise<Response> {
    if (request.method !== "POST") {
      return createErrorResponse(
        "Method not allowed.",
        405,
        {
          Allow: "POST"
        }
      );
    }

    const url =
      new URL(
        request.url
      );

    if (
      url.searchParams.has("secret")
    ) {
      return createErrorResponse(
        "Do not send preview secrets in the URL.",
        400
      );
    }

    const authorization =
      request.headers.get(
        "authorization"
      );

    const bearerMatch =
      authorization?.match(
        /^Bearer\s+(\S+)$/i
      );

    const providedSecret =
      bearerMatch?.[1];

    if (
      providedSecret !== secret
    ) {
      return createErrorResponse(
        "Invalid preview secret.",
        401
      );
    }

    let body: unknown;

    try {
      body =
        await request.json();
    } catch {
      return createErrorResponse(
        "A valid JSON request body is required.",
        400
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("path" in body)
    ) {
      return createErrorResponse(
        "A valid preview path is required.",
        400
      );
    }

    const path =
      getPreviewPath(
        body.path
      );

    if (!path) {
      return createErrorResponse(
        "A valid preview path is required.",
        400
      );
    }

    const mode =
      await draftMode();

    mode.enable();

    redirect(path);
  };
}