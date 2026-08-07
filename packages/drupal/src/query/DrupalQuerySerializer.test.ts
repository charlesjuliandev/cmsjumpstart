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
  
});