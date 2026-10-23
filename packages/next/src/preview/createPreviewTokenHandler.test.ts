
import {
  describe,
  expect,
  it
} from "vitest";

import {
  createPreviewTokenHandler
} from "./createPreviewTokenHandler";

import {
  verifyPreviewToken
} from "./previewSecurity";

const previewSecret = "correct-secret";

function createRequest(options: {
  method?: string;
  secret?: string;
  url?: string;
  body?: string;
} = {}): Request {
  const {
    method = "POST",
    secret = previewSecret,
    url = "https://next.example.com/api/preview-token",
    body = JSON.stringify({
      path: "/courses/intro"
    })
  } = options;

  return new Request(url, {
    method,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json"
    },
    body: method === "GET" ? undefined : body
  });
}

describe("createPreviewTokenHandler", () => {
  it("requires a preview secret", () => {
    expect(() =>
      createPreviewTokenHandler({ secret: "" })
    ).toThrow("A preview secret is required.");
  });

  it("rejects methods other than POST", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest({ method: "GET" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("rejects an invalid shared secret", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest({ secret: "wrong-secret" })
    );

    expect(response.status).toBe(401);
    expect(await response.text()).toBe("Invalid preview secret.");
  });

  it("rejects credentials in the URL", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest({
        url: "https://next.example.com/api/preview-token?secret=leaked"
      })
    );

    expect(response.status).toBe(400);
  });

  it("rejects malformed JSON", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest({ body: "{invalid-json" })
    );

    expect(response.status).toBe(400);
  });

  it("rejects unsafe redirect paths", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest({
        body: JSON.stringify({
          path: "https://evil.example.com"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      "A valid preview path is required."
    );
  });

  it("returns a signed token and expiry without caching", async () => {
    const handler = createPreviewTokenHandler({
      secret: previewSecret
    });

    const response = await handler(
      createRequest()
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");

    const body = await response.json() as {
      token: string;
      expiresAt: number;
      path: string;
    };

    expect(body.path).toBe("/courses/intro");
    expect(body.expiresAt).toBeGreaterThan(
      Math.floor(Date.now() / 1000)
    );

    expect(
      verifyPreviewToken(
        body.token,
        previewSecret
      )
    ).toBe("/courses/intro");
  });
});
