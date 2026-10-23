
import {
  createHmac,
  timingSafeEqual
} from "node:crypto";

const TOKEN_VERSION = 1;
const TOKEN_PURPOSE = "cmsjumpstart-preview";
const TOKEN_TTL_SECONDS = 60;
const TOKEN_MAX_LENGTH = 4096;

interface PreviewTokenPayload {
  v: number;
  purpose: string;
  path: string;
  exp: number;
}

export function getPreviewPath(
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
    const destination = new URL(
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

export function validateAllowedOrigin(
  value: string
): string {
  const configuredOrigin = value.trim();

  if (!configuredOrigin) {
    throw new Error(
      "A preview allowed origin is required."
    );
  }

  try {
    const parsed = new URL(configuredOrigin);

    const isHttps =
      parsed.protocol === "https:";

    const isLocalHttp =
      parsed.protocol === "http:" &&
      (
        parsed.hostname === "localhost" ||
        parsed.hostname === "127.0.0.1" ||
        parsed.hostname === "[::1]"
      );

    if (
      parsed.origin !== configuredOrigin ||
      (!isHttps && !isLocalHttp)
    ) {
      throw new Error();
    }

    return configuredOrigin;
  } catch {
    throw new Error(
      "The preview allowed origin must be an HTTPS origin without a trailing slash. HTTP is permitted only for localhost."
    );
  }
}

export function hasAllowedOrigin(
  request: Request,
  allowedOrigin: string
): boolean {
  return (
    request.headers.get("origin") ===
    allowedOrigin
  );
}

export function safeStringEqual(
  left: string,
  right: string
): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function signPayload(
  encodedPayload: string,
  secret: string
): string {
  return createHmac("sha256", secret)
    .update(encodedPayload)
    .digest("base64url");
}

export function createPreviewToken(
  secret: string,
  path: string,
  expiresAt: number
): string {
  const payload: PreviewTokenPayload = {
    v: TOKEN_VERSION,
    purpose: TOKEN_PURPOSE,
    path,
    exp: expiresAt
  };

  const encodedPayload = Buffer.from(
    JSON.stringify(payload)
  ).toString("base64url");

  const signature = signPayload(
    encodedPayload,
    secret
  );

  return `${encodedPayload}.${signature}`;
}

export function verifyPreviewToken(
  token: unknown,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000)
): string | null {
  if (
    typeof token !== "string" ||
    token.length === 0 ||
    token.length > TOKEN_MAX_LENGTH
  ) {
    return null;
  }

  const parts = token.split(".");

  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]!) ||
    !/^[A-Za-z0-9_-]+$/.test(parts[1]!)
  ) {
    return null;
  }

  const encodedPayload = parts[0]!;
  const suppliedSignature = parts[1]!;

  const expectedSignature = signPayload(
    encodedPayload,
    secret
  );

  if (
    !safeStringEqual(
      suppliedSignature,
      expectedSignature
    )
  ) {
    return null;
  }

  let payload: unknown;

  try {
    payload = JSON.parse(
      Buffer.from(
        encodedPayload,
        "base64url"
      ).toString("utf8")
    );
  } catch {
    return null;
  }

  if (
    typeof payload !== "object" ||
    payload === null
  ) {
    return null;
  }

  const candidate =
    payload as Partial<PreviewTokenPayload>;

  if (
    candidate.v !== TOKEN_VERSION ||
    candidate.purpose !== TOKEN_PURPOSE ||
    typeof candidate.exp !== "number" ||
    !Number.isSafeInteger(candidate.exp) ||
    candidate.exp <= nowSeconds
  ) {
    return null;
  }

  return getPreviewPath(candidate.path);
}

export function createErrorResponse(
  message: string,
  status: number,
  headers?: HeadersInit
): Response {
  return new Response(message, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "X-Content-Type-Options": "nosniff",
      ...headers
    }
  });
}

export async function readRequestFields(
  request: Request
): Promise<Record<string, unknown> | null> {
  try {
    const contentType =
      request.headers.get("content-type") ?? "";

    if (
      contentType.includes("application/json")
    ) {
      const body: unknown = await request.json();

      if (
        typeof body !== "object" ||
        body === null ||
        Array.isArray(body)
      ) {
        return null;
      }

      return body as Record<string, unknown>;
    }

    if (
      contentType.includes(
        "application/x-www-form-urlencoded"
      ) ||
      contentType.includes("multipart/form-data")
    ) {
      const formData = await request.formData();

      const fields: Record<string, unknown> = {};

      formData.forEach((value, key) => {
        fields[key] = value;
      });

      return fields;
    }

    return null;
  } catch {
    return null;
  }
}

export function hasCredentialQueryParameter(
  request: Request
): boolean {
  const url = new URL(request.url);

  return (
    url.searchParams.has("secret") ||
    url.searchParams.has("token")
  );
}

export const previewTokenLifetimeSeconds =
  TOKEN_TTL_SECONDS;
