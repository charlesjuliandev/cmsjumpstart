
import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const mocks = vi.hoisted(() => ({
  enable: vi.fn(),
  disable: vi.fn(),
  fetch: vi.fn()
}));

vi.mock("next/headers", () => ({
  draftMode: vi.fn().mockResolvedValue({
    isEnabled: false,
    enable: mocks.enable,
    disable: mocks.disable
  })
}));

import {
  createNativePreviewHandler
} from "./createNativePreviewHandler";

const previewSecret = "correct-secret-with-at-least-32-characters";
const drupalOrigin = "https://drupal.example.com";
const redemptionUrl =
  `${drupalOrigin}/cmsjumpstart/preview/redeem`;

const validTicket = "a".repeat(64);

function createHandler() {
  return createNativePreviewHandler({
    secret: previewSecret,
    drupalOrigin,
    redemptionUrl
  });
}

function createRequest(options: {
  method?: string;
  url?: string;
  origin?: string;
  ticket?: string;
  contentType?: string;
  body?: string;
} = {}): Request {
  const {
    method = "POST",
    url = "https://next.example.com/api/native-preview",
    origin = drupalOrigin,
    ticket = validTicket,
    contentType = "application/json",
    body
  } = options;

  const headers = new Headers();

  if (origin) {
    headers.set("Origin", origin);
  }

  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  let requestBody: BodyInit | undefined;

  if (body !== undefined) {
    requestBody = body;
  } else if (method !== "GET" && method !== "HEAD") {
    if (
      contentType
        .toLowerCase()
        .startsWith("application/x-www-form-urlencoded")
    ) {
      requestBody = new URLSearchParams({
        ticket
      }).toString();
    } else {
      requestBody = JSON.stringify({ ticket });
    }
  }

  return new Request(url, {
    method,
    headers,
    body: requestBody
  });
}

function successfulRedemption(
  path = "/courses/intro"
): Response {
  return new Response(
    JSON.stringify({ path }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    }
  );
}

describe("createNativePreviewHandler", () => {
  beforeEach(() => {
    mocks.enable.mockReset();
    mocks.disable.mockReset();
    mocks.fetch.mockReset();

    vi.stubGlobal("fetch", mocks.fetch);
  });

  it("requires a native preview secret", () => {
    expect(() =>
      createNativePreviewHandler({
        secret: " ",
        drupalOrigin,
        redemptionUrl
      })
    ).toThrow(
      "A native preview secret is required."
    );
  });

  it("requires a valid Drupal origin", () => {
    expect(() =>
      createNativePreviewHandler({
        secret: previewSecret,
        drupalOrigin: "https://drupal.example.com/admin",
        redemptionUrl
      })
    ).toThrow();
  });

  it("requires a redemption URL on the configured Drupal origin", () => {
    expect(() =>
      createNativePreviewHandler({
        secret: previewSecret,
        drupalOrigin,
        redemptionUrl:
          "https://other.example.com/redeem"
      })
    ).toThrow(
      "The redemption URL must be an absolute URL on the configured Drupal origin"
    );
  });

  it("rejects redemption URLs containing credentials or query parameters", () => {
    for (const invalidUrl of [
      "https://user:password@drupal.example.com/redeem",
      "https://drupal.example.com/redeem?secret=value",
      "https://drupal.example.com/redeem#fragment"
    ]) {
      expect(() =>
        createNativePreviewHandler({
          secret: previewSecret,
          drupalOrigin,
          redemptionUrl: invalidUrl
        })
      ).toThrow();
    }
  });

  it("rejects methods other than POST", async () => {
    const response = await createHandler()(
      createRequest({ method: "GET" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(mocks.fetch).not.toHaveBeenCalled();
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects credentials in the request URL", async () => {
    const response = await createHandler()(
      createRequest({
        url: "https://next.example.com/api/native-preview?ticket=leaked"
      })
    );

    expect(response.status).toBe(400);
    expect(await response.text()).toBe(
      "Do not send preview credentials in the URL."
    );
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects a missing or mismatched Origin", async () => {
    for (const origin of [
      "",
      "https://evil.example.com"
    ]) {
      const response = await createHandler()(
        createRequest({ origin })
      );

      expect(response.status).toBe(403);
    }

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects unsupported content types", async () => {
    const response = await createHandler()(
      createRequest({
        contentType: "application/jsonp"
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects malformed JSON", async () => {
    const response = await createHandler()(
      createRequest({
        body: "{invalid-json"
      })
    );

    expect(response.status).toBe(400);
    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("rejects a missing or malformed ticket", async () => {
    for (const ticket of [
      "",
      "not-a-ticket",
      "A".repeat(64),
      "a".repeat(63),
      "a".repeat(65)
    ]) {
      const response = await createHandler()(
        createRequest({ ticket })
      );

      expect(response.status).toBe(400);
    }

    expect(mocks.fetch).not.toHaveBeenCalled();
  });

  it("accepts a URL-encoded Drupal handoff form", async () => {
    mocks.fetch.mockResolvedValue(
      successfulRedemption()
    );

    const response = await createHandler()(
      createRequest({
        contentType:
          "application/x-www-form-urlencoded; charset=UTF-8"
      })
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("Location")).toBe(
      "/courses/intro"
    );
    expect(mocks.enable).toHaveBeenCalledOnce();
  });

  it("sends the ticket to Drupal using server-side Bearer authentication", async () => {
    mocks.fetch.mockResolvedValue(
      successfulRedemption()
    );

    const response = await createHandler()(
      createRequest()
    );

    expect(response.status).toBe(303);

    expect(mocks.fetch).toHaveBeenCalledOnce();

    const [url, options] =
      mocks.fetch.mock.calls[0]!;

    expect(url).toBeInstanceOf(URL);
    expect(url.toString()).toBe(redemptionUrl);
    expect(options).toMatchObject({
      method: "POST",
      redirect: "error",
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${previewSecret}`,
        "Content-Type": "application/json",
        Accept: "application/json"
      },
      body: JSON.stringify({
        ticket: validTicket
      })
    });

    expect(response.headers.get("Location")).toBe(
      "/courses/intro"
    );
    expect(response.headers.get("Cache-Control")).toBe(
      "no-store"
    );
    expect(response.headers.get("Referrer-Policy")).toBe(
      "no-referrer"
    );
    expect(mocks.enable).toHaveBeenCalledOnce();
  });

  it("does not enable Draft Mode when Drupal redemption fails", async () => {
    mocks.fetch.mockRejectedValue(
      new Error("Connection failed")
    );

    const response = await createHandler()(
      createRequest()
    );

    expect(response.status).toBe(502);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects an unsuccessful Drupal redemption", async () => {
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ error: "Invalid ticket" }),
        { status: 401 }
      )
    );

    const response = await createHandler()(
      createRequest()
    );

    expect(response.status).toBe(401);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects invalid JSON returned by Drupal", async () => {
    mocks.fetch.mockResolvedValue(
      new Response("not-json", {
        status: 200
      })
    );

    const response = await createHandler()(
      createRequest()
    );

    expect(response.status).toBe(502);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it("rejects a Drupal response without a path", async () => {
    mocks.fetch.mockResolvedValue(
      new Response(
        JSON.stringify({ success: true }),
        { status: 200 }
      )
    );

    const response = await createHandler()(
      createRequest()
    );

    expect(response.status).toBe(502);
    expect(mocks.enable).not.toHaveBeenCalled();
  });

  it.each([
    "https://evil.example.com",
    "//evil.example.com",
    "/\\evil.example.com"
  ])(
    "rejects an unsafe Drupal redirect path: %s",
    async (path) => {
      mocks.fetch.mockResolvedValue(
        successfulRedemption(path)
      );

      const response = await createHandler()(
        createRequest()
      );

      expect(response.status).toBe(502);
      expect(mocks.enable).not.toHaveBeenCalled();
    }
  );
});
