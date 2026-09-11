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
  value: string | null
): string | null {
  if (!value) {
    return null;
  }

  if (
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return null;
  }

  return value;
}

export function createPreviewHandler(
  options: PreviewHandlerOptions
) {
  if (!options.secret) {
    throw new Error(
      "A preview secret is required."
    );
  }

  return async function previewHandler(
    request: Request
  ): Promise<Response> {
    const url =
      new URL(
        request.url
      );

    const secret =
      url.searchParams.get(
        "secret"
      );

    if (
      secret !==
      options.secret
    ) {
      return new Response(
        "Invalid preview secret.",
        {
          status: 401
        }
      );
    }

    const path =
      getPreviewPath(
        url.searchParams.get(
          "path"
        )
      );

    if (!path) {
      return new Response(
        "A valid preview path is required.",
        {
          status: 400
        }
      );
    }

    const mode =
      await draftMode();

    mode.enable();

    redirect(path);
  };
}