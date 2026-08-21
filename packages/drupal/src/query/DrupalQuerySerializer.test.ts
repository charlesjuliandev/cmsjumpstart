import {
  describe,
  expect,
  it
} from "vitest";

import {
  DrupalQueryBuilder
} from "./DrupalQueryBuilder";

import {
  DrupalQuerySerializer
} from "./DrupalQuerySerializer";

describe("DrupalQuerySerializer", () => {
  it("serializes Drupal JSON:API parameters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--page")
        .include("field_image")
        .filter("status", true)
        .sort("-created")
        .page(1)
        .limit(10);

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.toString()
    ).toBe(
      "include=field_image&sort=-created&page%5Boffset%5D=10&page%5Blimit%5D=10&filter%5Bstatus%5D=true"
    );
  });

  it("serializes sparse fieldsets", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .fields(
          "title",
          "field_date",
          "field_image"
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "fields[node--event]"
      )
    ).toBe(
      "title,field_date,field_image"
    );
  });

  it("serializes comparison filters", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_date.value",
          ">=",
          "2026-08-13"
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][path]"
      )
    ).toBe(
      "field_date.value"
    );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(">=");

    expect(
      params.get(
        "filter[condition_0][condition][value]"
      )
    ).toBe(
      "2026-08-13"
    );
  });

  it("supports multiple comparison filters on the same field", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
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

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][path]"
      )
    ).toBe(
      "field_date.value"
    );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(">=");

    expect(
      params.get(
        "filter[condition_0][condition][value]"
      )
    ).toBe(
      "2026-08-13"
    );

    expect(
      params.get(
        "filter[condition_1][condition][path]"
      )
    ).toBe(
      "field_date.value"
    );

    expect(
      params.get(
        "filter[condition_1][condition][operator]"
      )
    ).toBe("<=");

    expect(
      params.get(
        "filter[condition_1][condition][value]"
      )
    ).toBe(
      "2026-08-31"
    );
  });

  it("serializes IN array values using indexed Drupal syntax", () => {
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

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe("admin");

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe("john");
  });

  it("serializes NOT IN array values using indexed Drupal syntax", () => {
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

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe("admin");

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe("john");
  });

  it("serializes BETWEEN array values using indexed Drupal syntax", () => {
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

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(
      "BETWEEN"
    );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe(
      "2026-08-01"
    );

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe(
      "2026-08-31"
    );
  });

  it("serializes NOT BETWEEN array values using indexed Drupal syntax", () => {
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

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(
      "NOT BETWEEN"
    );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe(
      "2026-08-01"
    );

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe(
      "2026-08-31"
    );
  });

  it("serializes numeric array values", () => {
    const query =
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "status",
          "IN",
          [
            1,
            2,
            3
          ]
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe("1");

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe("2");

    expect(
      params.get(
        "filter[condition_0][condition][value][3]"
      )
    ).toBe("3");
  });

  it("serializes boolean array values", () => {
    const query =
      DrupalQueryBuilder
        .create("node--article")
        .filter(
          "status",
          "IN",
          [
            true,
            false
          ]
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][value][1]"
      )
    ).toBe("true");

    expect(
      params.get(
        "filter[condition_0][condition][value][2]"
      )
    ).toBe("false");
  });

  it("serializes IS NULL without a value", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_image",
          "IS NULL"
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(
      "IS NULL"
    );

    expect(
      params.has(
        "filter[condition_0][condition][value]"
      )
    ).toBe(false);
  });

  it("serializes IS NOT NULL without a value", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "field_image",
          "IS NOT NULL"
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(
      "IS NOT NULL"
    );

    expect(
      params.has(
        "filter[condition_0][condition][value]"
      )
    ).toBe(false);
  });

  it("serializes multiple filters with indexed condition names", () => {
    const query =
      DrupalQueryBuilder
        .create("node--event")
        .filter(
          "status",
          true
        )
        .filter(
          "field_tags.name",
          "IN",
          [
            "Drupal",
            "Next.js"
          ]
        )
        .filter(
          "field_date.value",
          "BETWEEN",
          [
            "2026-08-01",
            "2026-08-31"
          ]
        );

    const params =
      DrupalQuerySerializer.serialize(
        query
      );

    expect(
      params.get(
        "filter[status]"
      )
    ).toBe("true");

    expect(
      params.get(
        "filter[condition_1][condition][path]"
      )
    ).toBe(
      "field_tags.name"
    );

    expect(
      params.get(
        "filter[condition_1][condition][value][1]"
      )
    ).toBe(
      "Drupal"
    );

    expect(
      params.get(
        "filter[condition_1][condition][value][2]"
      )
    ).toBe(
      "Next.js"
    );

    expect(
      params.get(
        "filter[condition_2][condition][operator]"
      )
    ).toBe(
      "BETWEEN"
    );

    expect(
      params.get(
        "filter[condition_2][condition][value][1]"
      )
    ).toBe(
      "2026-08-01"
    );

    expect(
      params.get(
        "filter[condition_2][condition][value][2]"
      )
    ).toBe(
      "2026-08-31"
    );
  });
});