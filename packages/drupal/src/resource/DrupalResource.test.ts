import { describe, expect, it, vi } from "vitest";
import { DrupalResource } from "./DrupalResource";
import { RequestExecutor } from "../executor/RequestExecutor";

describe("DrupalResource", () => {
  it("creates a resource query", () => {
    const resource =
      new DrupalResource("node--page");

    expect(
      resource
        .getQuery()
        .getResourceType()
    ).toBe("node--page");
  });

  it("supports query chaining", () => {
    const resource =
      new DrupalResource("node--page");

    resource
      .include("field_image")
      .filter("status", true)
      .sort("-created")
      .limit(10);

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.includes)
      .toEqual(["field_image"]);

    expect(options.filters)
      .toEqual({
        status: true
      });

    expect(options.sort)
      .toEqual(["-created"]);

    expect(options.limit)
      .toBe(10);
  });

  it("executes a Drupal JSON:API request", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        data: []
      })
    };

    const resource =
      new DrupalResource(
        "node--page",
        executor as unknown as RequestExecutor
      );

    await resource
      .limit(10)
      .get();

    const [
      path,
      params
    ] = executor.get.mock.calls[0];

    expect(path)
      .toBe("/jsonapi/node/page");

    expect(params)
      .toBeInstanceOf(URLSearchParams);
  });
});