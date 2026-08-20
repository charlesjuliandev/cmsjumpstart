import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  RequestExecutor
} from "./RequestExecutor";

import {
  BasicAuth
} from "../auth/BasicAuth";

import type {
  DrupalJsonApiRelationship
} from "../types/DrupalResponse";

describe("RequestExecutor", () => {
  it("executes a GET request", async () => {
    const response = {
      data: [
        {
          type: "node--page",
          id: "123"
        }
      ]
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => response
      })
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const result =
      await executor.get(
        "/jsonapi/node/page"
      );

    expect(fetch).toHaveBeenCalledWith(
      new URL(
        "https://example.com/jsonapi/node/page"
      ),
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept:
            "application/vnd.api+json"
        },
        signal:
          expect.any(AbortSignal)
      })
    );

    expect(result).toEqual(response);

    vi.unstubAllGlobals();
  });

  it("executes a GET request with query parameters", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: []
        })
      })
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const params =
      new URLSearchParams();

    params.set(
      "page[limit]",
      "10"
    );

    await executor.get(
      "/jsonapi/node/page",
      params
    );

    expect(fetch).toHaveBeenCalledWith(
      new URL(
        "https://example.com/jsonapi/node/page?page%5Blimit%5D=10"
      ),
      expect.objectContaining({
        method: "GET",
        headers: {
          Accept:
            "application/vnd.api+json"
        },
        signal:
          expect.any(AbortSignal)
      })
    );

    vi.unstubAllGlobals();
  });

  it("throws when the request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404
      })
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    await expect(
      executor.get(
        "/jsonapi/node/page"
      )
    ).rejects.toThrow(
      "Request failed with status 404"
    );

    vi.unstubAllGlobals();
  });

  it("adds basic authentication headers", async () => {
    global.fetch =
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({})
      });

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com",
        auth: new BasicAuth(
          "username",
          "password"
        )
      });

    await executor.get(
      "/jsonapi/node/page"
    );

    expect(fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers:
          expect.objectContaining({
            Authorization:
              "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
          }),
        signal:
          expect.any(AbortSignal)
      })
    );

    vi.unstubAllGlobals();
  });

  it("returns a typed Drupal response", async () => {
    const responseData = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "123",

          attributes: {
            title: "Test Page"
          }
        }
      ]
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          responseData
        )
      })
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const response =
      await executor.get<{
        title: string;
      }>("/jsonapi/node/page");

    expect(
      response.data[0]
        .attributes.title
    ).toBe("Test Page");

    vi.unstubAllGlobals();
  });

  it("returns typed Drupal relationships", async () => {
    const responseData = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "123",

          attributes: {
            title: "Test Page"
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-123"
              }
            }
          }
        }
      ]
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          responseData
        )
      })
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const response =
      await executor.get<
        {
          title: string;
        },
        {
          field_image:
            DrupalJsonApiRelationship;
        }
      >("/jsonapi/node/page");

    expect(
      response.data[0]
        .relationships
        ?.field_image.data
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });

    vi.unstubAllGlobals();
  });

  it("follows a Drupal next-page link", async () => {
    const nextResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "456",
          attributes: {
            title: "Next Page"
          }
        }
      ]
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue({
          jsonapi: {
            version: "1.0"
          },

          data: [
            {
              type: "node--page",
              id: "123"
            }
          ],

          links: {
            next: {
              href:
                "https://example.com/jsonapi/node/page?page[offset]=10"
            }
          }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(
          nextResponse
        )
      });

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const firstResponse =
      await executor.get(
        "/jsonapi/node/page"
      );

    const secondResponse =
      await executor.getNext(
        firstResponse
      );

    expect(secondResponse)
      .toEqual(nextResponse);

    expect(fetchMock)
      .toHaveBeenLastCalledWith(
        new URL(
          "https://example.com/jsonapi/node/page?page[offset]=10"
        ),
        expect.objectContaining({
          method: "GET",
          headers: {
            Accept:
              "application/vnd.api+json"
          },
          signal:
            expect.any(AbortSignal)
        })
      );

    vi.unstubAllGlobals();
  });

  it("follows a Drupal previous-page link", async () => {
    const previousResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "123",
          attributes: {
            title: "Previous Page"
          }
        }
      ]
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(
          previousResponse
        )
      });

    vi.stubGlobal(
      "fetch",
      fetchMock
    );

    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const response = {
      jsonapi: {
        version: "1.0"
      },

      data: [],

      links: {
        prev: {
          href:
            "https://example.com/jsonapi/node/page?page[offset]=0"
        }
      }
    };

    const result =
      await executor.getPrevious(
        response
      );

    expect(result)
      .toEqual(previousResponse);

    expect(fetchMock)
      .toHaveBeenCalledWith(
        new URL(
          "https://example.com/jsonapi/node/page?page[offset]=0"
        ),
        expect.objectContaining({
          method: "GET",
          headers: {
            Accept:
              "application/vnd.api+json"
          },
          signal:
            expect.any(AbortSignal)
        })
      );

    vi.unstubAllGlobals();
  });

  it("returns null when there is no next page", async () => {
    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const response = {
      jsonapi: {
        version: "1.0"
      },

      data: []
    };

    const result =
      await executor.getNext(
        response
      );

    expect(result)
      .toBeNull();
  });

  it("returns null when there is no previous page", async () => {
    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com"
      });

    const response = {
      jsonapi: {
        version: "1.0"
      },

      data: []
    };

    const result =
      await executor.getPrevious(
        response
      );

    expect(result)
      .toBeNull();
  });
});