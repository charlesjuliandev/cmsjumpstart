import { describe, expect, it, vi } from "vitest";
import { DrupalResource } from "./DrupalResource";
import { RequestExecutor } from "../executor/RequestExecutor";

describe("DrupalResource", () => {
  it("creates a resource query", () => {
    const resource = new DrupalResource("node--page");

    expect(resource.getQuery().getResourceType())
      .toBe("node--page");
  });

  it("builds an immutable query", () => {
    const resource = new DrupalResource("node--page");

    resource
      .include("field_image")
      .filter("status", true)
      .sort("-created")
      .page(1)
      .limit(10);

    const query = resource.getQuery();

    expect(query.getResourceType())
      .toBe("node--page");

    expect(query.getOptions())
      .toEqual({
        includes: ["field_image"],
        filters: {
          status: true
        },
        sort: ["-created"],
        page: 1,
        limit: 10
      });
  });

  it("executes the resource query with the correct path and parameters", async () => {
    const response = {
      data: []
    };

    const executor = {
      get: vi.fn().mockResolvedValue(response)
    };

    const resource = new DrupalResource(
      "node--page",
      executor as unknown as RequestExecutor
    );

    const result = await resource
      .include("field_image")
      .filter("status", true)
      .sort("-created")
      .limit(10)
      .get();

    expect(executor.get).toHaveBeenCalledTimes(1);

    const [path, params] =
      executor.get.mock.calls[0];

    expect(path).toBe("/jsonapi/node--page");

    expect(params).toBeInstanceOf(URLSearchParams);

    expect(params.get("include"))
      .toBe("field_image");

    expect(params.get("filter[status]"))
      .toBe("true");

    expect(params.get("sort"))
      .toBe("-created");

    expect(params.get("page[limit]"))
      .toBe("10");

    expect(result).toEqual(response);
  });
});