import {
  revalidateResource
} from "./revalidateResource";

export interface RevalidationHandlerOptions {
  secret: string;
}

interface RevalidationPayload {
  resource?: {
    type?: unknown;

    id?: unknown;
  };
}

interface RevalidationResource {
  type: string;

  id?: string;
}

function createErrorResponse(
  message: string,
  status: number
): Response {
  return Response.json(
    {
      error: message
    },
    {
      status
    }
  );
}

function getBearerToken(
  request: Request
): string | null {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice("Bearer ".length)
      .trim();

  return token || null;
}

function parseResource(
  payload: unknown
): RevalidationResource | null {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return null;
  }

  const resource =
    (payload as RevalidationPayload)
      .resource;

  if (
    !resource ||
    typeof resource !== "object"
  ) {
    return null;
  }

  if (
    typeof resource.type !==
      "string" ||
    !resource.type.trim()
  ) {
    return null;
  }

  if (
    resource.id !== undefined &&
    (
      typeof resource.id !==
        "string" ||
      !resource.id.trim()
    )
  ) {
    return null;
  }

  const type =
    resource.type.trim();

  const id =
    resource.id !== undefined
      ? resource.id.trim()
      : undefined;

  return {
    type,

    ...(id !== undefined
      ? { id }
      : {})
  };
}

export function createRevalidationHandler(
  options: RevalidationHandlerOptions
) {
  const secret =
    options.secret?.trim();

  if (!secret) {
    throw new Error(
      "A revalidation secret is required."
    );
  }

  return async function revalidationHandler(
    request: Request
  ): Promise<Response> {
    const token =
      getBearerToken(request);

    if (
      token !== secret
    ) {
      return createErrorResponse(
        "Invalid revalidation secret.",
        401
      );
    }

    let payload: unknown;

    try {
      payload =
        await request.json();
    } catch {
      return createErrorResponse(
        "Invalid JSON request body.",
        400
      );
    }

    const resource =
      parseResource(payload);

    if (!resource) {
      return createErrorResponse(
        "A valid resource is required.",
        400
      );
    }

    revalidateResource(
      resource.type,
      resource.id
    );

    return Response.json(
      {
        revalidated: true,

        resource
      }
    );
  };
}

