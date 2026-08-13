import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  DrupalResource
} from "./DrupalResource";

import {
  RequestExecutor
} from "../executor/RequestExecutor";

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
      .toEqual([
        {
          field: "status",
          operator: "=",
          value: true
        }
      ]);

    expect(options.sort)
      .toEqual(["-created"]);

    expect(options.limit)
      .toBe(10);
  });

  it("supports comparison filters", () => {
    const resource =
      new DrupalResource("node--event");

    resource.filter(
      "field_date.value",
      ">=",
      "2026-08-13"
    );

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.filters)
      .toEqual([
        {
          field: "field_date.value",
          operator: ">=",
          value: "2026-08-13"
        }
      ]);
  });

  it("supports multiple comparison filters", () => {
    const resource =
      new DrupalResource("node--event");

    resource
      .filter(
        "field_date.value",
        ">=",
        "2026-08-13"
      )
      .filter(
        "field_date.value",
        "<=",
        "2026-08-31"
      );

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.filters)
      .toEqual([
        {
          field: "field_date.value",
          operator: ">=",
          value: "2026-08-13"
        },
        {
          field: "field_date.value",
          operator: "<=",
          value: "2026-08-31"
        }
      ]);
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

  it("supports typed Drupal resource attributes", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        jsonapi: {
          version: "1.0"
        },
        data: [
          {
            type: "node--page",
            id: "123",
            attributes: {
              title: "Test Page",
              status: true
            }
          }
        ]
      })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource<{
        title: string;
        status: boolean;
      }>(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    expect(
      response.data[0].attributes.title
    ).toBe("Test Page");

    expect(
      response.data[0].attributes.status
    ).toBe(true);
  });
});