import { describe, expect, it } from "vitest";
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
      DrupalQuerySerializer.serialize(query);

    expect(params.toString())
      .toBe(
        "include=field_image&sort=-created&page%5Boffset%5D=10&page%5Blimit%5D=10&filter%5Bstatus%5D=true"
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
      DrupalQuerySerializer.serialize(query);

    expect(
      params.get(
        "filter[condition_0][condition][path]"
      )
    ).toBe("field_date.value");

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(">=");

    expect(
      params.get(
        "filter[condition_0][condition][value]"
      )
    ).toBe("2026-08-13");
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
      DrupalQuerySerializer.serialize(query);

    expect(
      params.get(
        "filter[condition_0][condition][path]"
      )
    ).toBe("field_date.value");

    expect(
      params.get(
        "filter[condition_0][condition][operator]"
      )
    ).toBe(">=");

    expect(
      params.get(
        "filter[condition_0][condition][value]"
      )
    ).toBe("2026-08-13");

    expect(
      params.get(
        "filter[condition_1][condition][path]"
      )
    ).toBe("field_date.value");

    expect(
      params.get(
        "filter[condition_1][condition][operator]"
      )
    ).toBe("<=");

    expect(
      params.get(
        "filter[condition_1][condition][value]"
      )
    ).toBe("2026-08-31");
  });
});