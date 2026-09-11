import {
  createHmac,
  timingSafeEqual
} from "node:crypto";

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

interface DrupalWebhookValue {
  value?: unknown;

  target_id?: unknown;
}

interface DrupalWebhookEntity {
  uuid?: DrupalWebhookValue[];

  type?: DrupalWebhookValue[];
}

interface DrupalWebhookPayload {
  event?: unknown;

  entity?: DrupalWebhookEntity;
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

function getSignature(
  request: Request
): string | null {
  const signature =
    request.headers.get(
      "x-hub-signature-256"
    );

  if (!signature) {
    return null;
  }

  return signature.trim() || null;
}

function verifySignature(
  body: string,
  secret: string,
  signature: string
): boolean {
  if (
    !signature.startsWith(
      "sha256="
    )
  ) {
    return false;
  }

  const received =
    signature.slice(
      "sha256=".length
    );

  if (
    !/^[a-f0-9]{64}$/i.test(
      received
    )
  ) {
    return false;
  }

  const expected =
    createHmac(
      "sha256",
      secret
    )
      .update(body, "utf8")
      .digest("hex");

  const expectedBuffer =
    Buffer.from(
      expected,
      "hex"
    );

  const receivedBuffer =
    Buffer.from(
      received,
      "hex"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
}

function getStringValue(
  values:
    | DrupalWebhookValue[]
    | undefined
): string | null {
  const value =
    values?.[0]?.value;

  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return null;
  }

  return value.trim();
}

function getTargetId(
  values:
    | DrupalWebhookValue[]
    | undefined
): string | null {
  const targetId =
    values?.[0]?.target_id;

  if (
    typeof targetId !== "string" &&
    typeof targetId !== "number"
  ) {
    return null;
  }

  const value =
    String(targetId).trim();

  return value || null;
}

function parseCmsJumpstartResource(
  payload: unknown
): RevalidationResource | null {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return null;
  }

  const resource =
    (
      payload as
        RevalidationPayload
    ).resource;

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

function parseDrupalWebhookResource(
  payload: unknown
): RevalidationResource | null {
  if (
    !payload ||
    typeof payload !== "object"
  ) {
    return null;
  }

  const webhookPayload =
    payload as DrupalWebhookPayload;

  if (
    typeof webhookPayload.event !==
      "string"
  ) {
    return null;
  }

  if (
    !/^entity:node:(create|update|delete)$/
      .test(webhookPayload.event)
  ) {
    return null;
  }

  const entity =
    webhookPayload.entity;

  if (
    !entity ||
    typeof entity !== "object"
  ) {
    return null;
  }

  const uuid =
    getStringValue(
      entity.uuid
    );

  const bundle =
    getTargetId(
      entity.type
    );

  if (
    !uuid ||
    !bundle
  ) {
    return null;
  }

  return {
    type: `node--${bundle}`,

    id: uuid
  };
}

function parseResource(
  payload: unknown
): RevalidationResource | null {
  return (
    parseCmsJumpstartResource(
      payload
    ) ??
    parseDrupalWebhookResource(
      payload
    )
  );
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
    const body =
      await request.text();

    const signature =
      getSignature(request);

    const bearerToken =
      getBearerToken(request);

    const authenticatedBySignature =
      signature !== null &&
      verifySignature(
        body,
        secret,
        signature
      );

    const authenticatedByBearer =
      bearerToken === secret;

    if (
      !authenticatedBySignature &&
      !authenticatedByBearer
    ) {
      return createErrorResponse(
        "Invalid revalidation secret.",
        401
      );
    }

    let payload: unknown;

    try {
      payload =
        JSON.parse(body);
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

