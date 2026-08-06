import { describe, expect, it } from "vitest";
import { DrupalQueryBuilder } from "./DrupalQueryBuilder";

describe("DrupalQueryBuilder", () => {
  it("creates immutable queries", () => {
    const base = DrupalQueryBuilder.create(
      "node--page"
    );

    const query = base
      .include("field_image")
      .sort("-created")
      .page(1)
      .limit(10);

    expect(base.getResourceType()).toBe(
      "node--page"
    );

    expect(base.getOptions()).toEqual({});

    expect(query.getResourceType()).toBe(
      "node--page"
    );

    expect(query.getOptions()).toEqual({
      includes: [
        "field_image"
      ],
      sort: [
        "-created"
      ],
      page: 1,
      limit: 10
    });
  });
});