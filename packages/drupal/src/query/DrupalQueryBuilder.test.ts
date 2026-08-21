import {
  describe,
  expect,
  it
} from "vitest";

import {
  DrupalQueryBuilder
} from "./DrupalQueryBuilder";

describe("DrupalQueryBuilder", () => {
  it("creates immutable queries", () => {
    const base =
      DrupalQueryBuilder.create(
        "node--page"
      );

    const query =
      base
        .include("field_image")
        .filter("status", true)
        .sort("-created")
        .page(1)
        .limit(10);

    expect(
      base.getResourceType()
    ).toBe("node--page");

    expect(
      base.getOptions()
    ).toEqual({});

    expect(
      query.getResourceType()
    ).toBe("node--page");

    expect(
      query.getOptions()
    ).toEqual({
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

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "field_date",
        operator: ">=",
        value: "2026-08-11"
      }
    ]);
  });

  it("supports all Drupal comparison operators", () => {
    const operators = [
      "<>",
      ">",
      ">=",
      "<",
      "<=",
      "STARTS_WITH",
      "CONTAINS",
      "ENDS_WITH"
    ] as const;

    operators.forEach(
      operator => {
        const query =
          DrupalQueryBuilder
            .create("node--event")
            .filter(
              "title",
              operator,
              "Drupal"
            );

        expect(
          query.getOptions().filters?.[0]
        ).toEqual({
          field: "title",
          operator,
          value: "Drupal"
        });
      }
    );
  });

  it("supports IN filters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "IN",
          [
            "admin",
            "john"
          ]
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "uid.name",
        operator: "IN",
        value: [
          "admin",
          "john"
        ]
      }
    ]);
  });

  it("supports NOT IN filters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "NOT IN",
          [
            "admin",
            "john"
          ]
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "uid.name",
        operator: "NOT IN",
        value: [
          "admin",
          "john"
        ]
      }
    ]);
  });

  it("supports BETWEEN filters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "BETWEEN",
          [
            "2026-08-01",
            "2026-08-31"
          ]
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "field_date.value",
        operator: "BETWEEN",
        value: [
          "2026-08-01",
          "2026-08-31"
        ]
      }
    ]);
  });

  it("supports NOT BETWEEN filters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "NOT BETWEEN",
          [
            "2026-08-01",
            "2026-08-31"
          ]
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "field_date.value",
        operator: "NOT BETWEEN",
        value: [
          "2026-08-01",
          "2026-08-31"
        ]
      }
    ]);
  });

  it("supports IS NULL", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_image",
          "IS NULL"
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "field_image",
        operator: "IS NULL"
      }
    ]);
  });

  it("supports IS NOT NULL", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_image",
          "IS NOT NULL"
        );

    expect(
      query.getOptions().filters
    ).toEqual([
      {
        field: "field_image",
        operator: "IS NOT NULL"
      }
    ]);
  });

  it("rejects scalar values for IN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "IN",
          "admin"
        )
    ).toThrow(
      'Filter "IN" requires an array value.'
    );
  });

  it("rejects scalar values for NOT IN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "NOT IN",
          "admin"
        )
    ).toThrow(
      'Filter "NOT IN" requires an array value.'
    );
  });

  it("rejects scalar values for BETWEEN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "BETWEEN",
          "2026-08-01"
        )
    ).toThrow(
      'Filter "BETWEEN" requires an array value.'
    );
  });

  it("rejects scalar values for NOT BETWEEN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "NOT BETWEEN",
          "2026-08-01"
        )
    ).toThrow(
      'Filter "NOT BETWEEN" requires an array value.'
    );
  });

  it("rejects empty arrays for IN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "IN",
          []
        )
    ).toThrow(
      'Filter "IN" requires at least one value.'
    );
  });

  it("rejects empty arrays for NOT IN", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "uid.name",
          "NOT IN",
          []
        )
    ).toThrow(
      'Filter "NOT IN" requires at least one value.'
    );
  });

  it("rejects BETWEEN values with fewer than two values", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "BETWEEN",
          [
            "2026-08-01"
          ]
        )
    ).toThrow(
      'Filter "BETWEEN" requires exactly two values.'
    );
  });

  it("rejects BETWEEN values with more than two values", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "BETWEEN",
          [
            "2026-08-01",
            "2026-08-15",
            "2026-08-31"
          ]
        )
    ).toThrow(
      'Filter "BETWEEN" requires exactly two values.'
    );
  });

  it("rejects NOT BETWEEN values with fewer than two values", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "NOT BETWEEN",
          [
            "2026-08-01"
          ]
        )
    ).toThrow(
      'Filter "NOT BETWEEN" requires exactly two values.'
    );
  });

  it("rejects NOT BETWEEN values with more than two values", () => {
    expect(() =>
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          "NOT BETWEEN",
          [
            "2026-08-01",
            "2026-08-15",
            "2026-08-31"
          ]
        )
    ).toThrow(
      'Filter "NOT BETWEEN" requires exactly two values.'
    );
  });
});