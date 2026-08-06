import { describe, it, expect } from "vitest";
import { createCMSConfig } from "./createCMSConfig";

describe("createCMSConfig", () => {

  it("creates a CMSJumpstart configuration", () => {

    const config = createCMSConfig({
      site: {
        name: "Test Site",
        url: "https://example.com"
      },

      cms: {
        provider: "drupal",
        url: "https://cms.example.com"
      }
    });


    expect(config.cms.provider)
      .toBe("drupal");

    expect(config.features?.search)
      .toBe(false);

  });

});