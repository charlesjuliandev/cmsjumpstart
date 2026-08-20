import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  createDrupalClient
} from "./index";

import {
  DrupalClient
} from "./DrupalClient";

describe("createDrupalClient", () => {
  it("creates a DrupalClient", () => {
    const client =
      createDrupalClient({
        baseUrl:
          "https://example.com"
      });

    expect(client)
      .toBeInstanceOf(
        DrupalClient
      );
  });

  it("converts apiKey into api-key authentication", async () => {
    const fetchMock =
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonapi: {
            version: "1.0"
          },
          data: []
        })
      });

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const client =
      createDrupalClient({
        baseUrl:
          "https://example.com",
        apiKey: "secret"
      });

    await client
      .resource("node--page")
      .get();

    expect(fetchMock)
      .toHaveBeenCalledWith(
        new URL(
          "https://example.com/jsonapi/node/page"
        ),
        expect.objectContaining({
          method: "GET",
          headers: {
            Accept:
              "application/vnd.api+json",
            Authorization: "secret"
          },
          signal:
            expect.any(AbortSignal)
        })
      );

    vi.unstubAllGlobals();
  });

  it("preserves explicit auth configuration", async () => {
    const fetchMock =
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonapi: {
            version: "1.0"
          },
          data: []
        })
      });

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const client =
      createDrupalClient({
        baseUrl:
          "https://example.com",
        auth: {
          type: "bearer",
          token: "token-value"
        }
      });

    await client
      .resource("node--page")
      .get();

    expect(fetchMock)
      .toHaveBeenCalledWith(
        new URL(
          "https://example.com/jsonapi/node/page"
        ),
        expect.objectContaining({
          method: "GET",
          headers: {
            Accept:
              "application/vnd.api+json",
            Authorization:
              "Bearer token-value"
          },
          signal:
            expect.any(AbortSignal)
        })
      );

    vi.unstubAllGlobals();
  });

  it("preserves custom headers", async () => {
    const fetchMock =
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonapi: {
            version: "1.0"
          },
          data: []
        })
      });

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const client =
      createDrupalClient({
        baseUrl:
          "https://example.com",
        headers: {
          "X-Consumer-ID":
            "consumer-id"
        }
      });

    await client
      .resource("node--page")
      .get();

    expect(fetchMock)
      .toHaveBeenCalledWith(
        new URL(
          "https://example.com/jsonapi/node/page"
        ),
        expect.objectContaining({
          method: "GET",
          headers: {
            Accept:
              "application/vnd.api+json",
            "X-Consumer-ID":
              "consumer-id"
          },
          signal:
            expect.any(AbortSignal)
        })
      );

    vi.unstubAllGlobals();
  });
});