import { describe, expect, it } from "vitest";
import {
  createDrupalClient,
  DrupalClient,
  DrupalResource
} from "./index";

describe("public Drupal API", () => {
  it("exports the primary Drupal client API", () => {
    expect(createDrupalClient).toBeDefined();
    expect(DrupalClient).toBeDefined();
    expect(DrupalResource).toBeDefined();
  });
});