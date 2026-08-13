import { describe, expect, it } from "vitest";
import { DrupalQueryBuilder } from "./DrupalQueryBuilder";

describe("DrupalQueryBuilder", () => {
  it("creates immutable queries", () => {
    const base = DrupalQueryBuilder.create(
      "node--page"
    );

    const query = base
      .include("field_image")
      .filter("status", true)
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
      filters: [
        {
          field: "status",
          operator: "=",
          value: true
        }
      ],
      sort: [
        "-created"
      ],
      page: 1,
      limit: 10
    });
  });

  it("supports comparison operators", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date",
          ">=",
          "2026-08-11"
        );

    expect(query.getOptions().filters)
      .toEqual([
        {
          field: "field_date",
          operator: ">=",
          value: "2026-08-11"
        }
      ]);
  });
});