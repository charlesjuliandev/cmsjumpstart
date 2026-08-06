import { describe, expect, it } from "vitest";
import { DrupalResource } from "./DrupalResource";

describe("DrupalResource", () => {
  it("creates a resource query", () => {
    const resource =
      new DrupalResource(
        "node--page"
      )
      .include("field_image")
      .limit(10);

    const query = resource.getQuery();

    expect(
      query.getResourceType()
    )
    .toBe("node--page");

    expect(
      query.getOptions()
    )
    .toEqual({
      includes: [
        "field_image"
      ],
      limit: 10
    });
  });


  it("supports fluent chaining", () => {
    const resource =
      new DrupalResource(
        "node--page"
      );

    const result =
      resource
        .include("field_image")
        .limit(10)
        .sort("-created");


    expect(result)
      .toBe(resource);


    expect(
      result
        .getQuery()
        .getOptions()
    )
    .toEqual({
      includes: [
        "field_image"
      ],
      limit: 10,
      sort: [
        "-created"
      ]
    });
  });
});