
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const mocks = vi.hoisted(() => ({
  disable: vi.fn()
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({
    isEnabled: true,
    enable: vi.fn(),
    disable: mocks.disable
  })
}));

import {
  createExitPreviewHandler
} from "./createExitPreviewHandler";

const allowedOrigin = "https://drupal.example.com";

function createRequest(options: {
  method?: string;
  origin?: string;
  body?: string;
  url?: string;
} = {}): Request {
  const {
    method = "POST",
    origin = allowedOrigin,
    body = JSON.stringify({ path: "/courses" }),
    url = "https://next.example.com/exit-preview"
  } = options;

  const headers = new Headers({
    "Content-Type": "application/json"
  });

  if (origin) {
    headers.set("Origin", origin);
  }

  return new Request(url, {
    method,
    headers,
    body: method === "GET" ? undefined : body
  });
}

describe("createExitPreviewHandler", () => {
  beforeEach(() => {
    mocks.disable.mockClear();
  });

  it("rejects methods other than POST", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      createRequest({ method: "GET" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(mocks.disable).not.toHaveBeenCalled();
  });

  it("rejects a missing Origin", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      createRequest({ origin: "" })
    );

    expect(response.status).toBe(403);
    expect(mocks.disable).not.toHaveBeenCalled();
  });

  it("rejects an invalid Origin", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      createRequest({ origin: "https://evil.example.com" })
    );

    expect(response.status).toBe(403);
    expect(mocks.disable).not.toHaveBeenCalled();
  });

  it("rejects an external redirect path", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      createRequest({
        body: JSON.stringify({
          path: "https://evil.example.com"
        })
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.disable).not.toHaveBeenCalled();
  });

  it("disables Draft Mode and redirects to a valid local path", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      createRequest()
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "/courses"
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store"
    );
    expect(response.headers.get("Referrer-Policy")).toBe(
      "no-referrer"
    );
    expect(mocks.disable).toHaveBeenCalledTimes(1);
  });

  it("defaults to the home page when no body is supplied", async () => {
    const handler = createExitPreviewHandler({
      allowedOrigin
    });

    const response = await handler(
      new Request("https://next.example.com/exit-preview", {
        method: "POST",
        headers: {
          Origin: allowedOrigin
        }
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe("/");
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store"
    );
    expect(response.headers.get("Referrer-Policy")).toBe(
      "no-referrer"
    );
    expect(mocks.disable).toHaveBeenCalledTimes(1);
  });
});
