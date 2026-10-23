
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  disable: vi.fn()
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({
    isEnabled: false,
    enable: mocks.enable,
    disable: mocks.disable
  })
}));

import {
  createPreviewHandler
} from "./createPreviewHandler";

import {
  createPreviewToken
} from "./previewSecurity";

const previewSecret = "correct-secret";
const allowedOrigin = "https://drupal.example.com";

function createToken(
  path = "/",
  expiresAt =
    Math.floor(Date.now() / 1000) + 60
): string {
  return createPreviewToken(
    previewSecret,
    path,
    expiresAt
  );
}

function createRequest(options: {
  method?: string;
  url?: string;
  origin?: string;
  token?: string;
  body?: string;
  form?: boolean;
} = {}): Request {
  const {
    method = "POST",
    url = "https://next.example.com/preview",
    origin = allowedOrigin,
    token = createToken(),
    body,
    form = false
  } = options;

  const headers = new Headers();

  if (origin) {
    headers.set("Origin", origin);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    requestBody = body;
    headers.set("Content-Type", "application/json");
  } else if (form) {
    const params = new URLSearchParams({ token });
    requestBody = params.toString();
    headers.set(
      "Content-Type",
      "application/x-www-form-urlencoded"
    );
  } else if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    headers.set("Content-Type", "application/json");
    requestBody = JSON.stringify({ token });
  }

  return new Request(url, {
    method,
    headers,
    body: requestBody
  });
}

describe("createPreviewHandler", () => {
  beforeEach(() => {
    mocks.enable.mockClear();
    mocks.disable.mockClear();
  });

  it("requires a preview secret", () => {
    expect(() =>
      createPreviewHandler({
        secret: "",
        allowedOrigin
      })
    ).toThrow("A preview secret is required.");
  });

  it("requires a valid allowed origin", () => {
    expect(() =>
      createPreviewHandler({
        secret: previewSecret,
        allowedOrigin: "https://drupal.example.com/admin"
      })
    ).toThrow("The preview allowed origin");
  });

  it("rejects methods other than POST", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({ method: "GET" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects credentials in the URL", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        url: "https://next.example.com/preview?secret=leaked"
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      "Do not send preview credentials in the URL."
    );
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects a missing or mismatched Origin", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    for (const origin of [
      "",
      "https://bad.example.com"
    ]) {
      const response = await handler(
        createRequest({ origin })
      );

      expect(response.status).toBe(403);
    }

    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({ body: "{invalid-json" })
    );

    expect(response.status).toBe(400);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects a missing token", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        body: JSON.stringify({})
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects a tampered token", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        token: `${createToken()}tampered`
      })
    );

    expect(response.status).toBe(401);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects an expired token", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const token = createToken(
      "/about-us",
      Math.floor(Date.now() / 1000) - 1
    );

    const response = await handler(
      createRequest({ token })
    );

    expect(response.status).toBe(401);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com"
  ])(
    "rejects a token containing an unsafe path: %s",
    async (path) => {
      const handler = createPreviewHandler({
        secret: previewSecret,
        allowedOrigin
      });

      const token = createToken(path);

      const response = await handler(
        createRequest({ token })
      );

      expect(response.status).toBe(401);
      expect(mocks.enable).not.toHaveBeenCalled();
    }
  );

  it("accepts a valid JSON token and redirects locally", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        token: createToken("/about-us")
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "/about-us"
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store"
    );
    expect(response.headers.get("Referrer-Policy")).toBe(
      "no-referrer"
    );
    expect(mocks.enable).toHaveBeenCalledTimes(1);
  });

  it("accepts a valid HTML form submission", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        token: createToken("/courses/intro"),
        form: true
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "/courses/intro"
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store"
    );
    expect(response.headers.get("Referrer-Policy")).toBe(
      "no-referrer"
    );
    expect(mocks.enable).toHaveBeenCalledTimes(1);
  });

  it("preserves a query string in a signed local path", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        token: createToken("/about-us?foo=bar")
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "/about-us?foo=bar"
    );
    expect(mocks.enable).toHaveBeenCalledTimes(1);
  });

  it("marks error responses as non-cacheable", async () => {
    const handler = createPreviewHandler({
      secret: previewSecret,
      allowedOrigin
    });

    const response = await handler(
      createRequest({ token: "invalid" })
    );

    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.get("Referrer-Policy")).toBe("no-referrer");
  });
});
