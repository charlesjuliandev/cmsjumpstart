import { loadEnvFile } from "node:process";
import { describe, expect, it } from "vitest";
import { DrupalQueryBuilder } from "./DrupalQueryBuilder";
import { DrupalQuerySerializer } from "./DrupalQuerySerializer";

loadEnvFile(".env.local");

const drupalUrl = process.env.DRUPAL_URL;
const drupalUsername = process.env.DRUPAL_USERNAME;
const drupalPassword = process.env.DRUPAL_PASSWORD;

describe("Drupal JSON:API integration", () => {
  it("fetches upcoming events using a date comparison filter", async () => {
    if (
      !drupalUrl ||
      !drupalUsername ||
      !drupalPassword
    ) {
      throw new Error(
        "Missing DRUPAL_URL, DRUPAL_USERNAME, or DRUPAL_PASSWORD environment variables."
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayIso = today.toISOString();

    const query = DrupalQueryBuilder
      .create("node--event")
      .filter(
        "field_date.value",
        ">=",
        todayIso
      )
      .sort("field_date.value")
      .limit(5);

    const params =
      DrupalQuerySerializer.serialize(query);

    const url = new URL(
      "/jsonapi/node/event",
      `${drupalUrl.replace(/\/$/, "")}/`
    );

    url.search = params.toString();

    const credentials = Buffer
      .from(
        `${drupalUsername}:${drupalPassword}`
      )
      .toString("base64");

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/vnd.api+json",
        Authorization: `Basic ${credentials}`
      }
    });

    const responseBody =
      await response.text();

    console.log("\nDrupal integration test:");
    console.log("Status:", response.status);
    console.log("Status text:", response.statusText);
    console.log("URL:", url.toString());
    console.log("Response:", responseBody);

    expect(response.ok).toBe(true);

    const body =
      JSON.parse(responseBody);

    expect(body).toHaveProperty("data");
    expect(Array.isArray(body.data)).toBe(true);
  });

  it("serializes comparison filters using Drupal condition syntax", () => {
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

    expect(params.toString()).toBe(
      "filter%5Bcondition_0%5D%5Bcondition%5D%5Bpath%5D=field_date.value&filter%5Bcondition_0%5D%5Bcondition%5D%5Boperator%5D=%3E%3D&filter%5Bcondition_0%5D%5Bcondition%5D%5Bvalue%5D=2026-08-13"
    );
  });
});