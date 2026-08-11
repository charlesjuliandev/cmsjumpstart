import { describe, expect, it, vi } from "vitest";
import { RequestExecutor } from "./RequestExecutor";
import { BasicAuth } from "../auth/BasicAuth";
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

    const executor = new RequestExecutor({
      baseUrl: "https://example.com"
    });

    const result = await executor.get(
      "/jsonapi/node/page"
    );

    expect(fetch).toHaveBeenCalledWith(
      new URL(
        "https://example.com/jsonapi/node/page"
      ),
      {
        method: "GET",
        headers: {
          Accept: "application/vnd.api+json"
        }
      }
    );

    expect(result).toEqual(response);

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

    const executor = new RequestExecutor({
      baseUrl: "https://example.com"
    });

    await expect(
      executor.get("/jsonapi/node/page")
    ).rejects.toThrow(
      "Request failed with status 404"
    );

    vi.unstubAllGlobals();
  });

  it("adds basic authentication headers", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({})
    });

    const executor = new RequestExecutor({
      baseUrl: "https://example.com",
      auth: new BasicAuth(
        "username",
        "password"
      )
    });

    await executor.get("/jsonapi/node/page");

    expect(fetch).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization:
            "Basic dXNlcm5hbWU6cGFzc3dvcmQ="
        })
      })
    );
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

    const executor = new RequestExecutor({
      baseUrl: "https://example.com"
    });

    const response =
      await executor.get<{
        title: string;
      }>("/jsonapi/node/page");

    expect(
      response.data[0].attributes.title
    ).toBe("Test Page");
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

    const executor = new RequestExecutor({
      baseUrl: "https://example.com"
    });

    const response =
      await executor.get<
        {
          title: string;
        },
        {
          field_image: DrupalJsonApiRelationship;
        }
      >("/jsonapi/node/page");

    expect(
      response.data[0].relationships
        ?.field_image.data
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });

    vi.unstubAllGlobals();
  });
});