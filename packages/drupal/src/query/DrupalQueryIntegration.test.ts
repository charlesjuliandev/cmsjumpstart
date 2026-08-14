import { loadEnvFile } from "node:process";
import { describe, expect, it } from "vitest";
import { DrupalClient } from "../client/DrupalClient";
import { DrupalQueryBuilder } from "./DrupalQueryBuilder";
import { DrupalQuerySerializer } from "./DrupalQuerySerializer";

loadEnvFile(".env.local");

const drupalUrl = process.env.DRUPAL_URL;
const httpAuthUsername =
  process.env.HTAUTH_U;
const httpAuthPassword =
  process.env.HTAUTH_P;
const consumerId =
  process.env.CONSUMERUUID;
const apiKey =
  process.env.UP_API_KEY;

describe("Drupal JSON:API integration", () => {
  const createTestClient = () => {
    if (
      !drupalUrl ||
      !httpAuthUsername ||
      !httpAuthPassword ||
      !consumerId ||
      !apiKey
    ) {
      throw new Error(
        "Missing DRUPAL_URL, HTAUTH_U, HTAUTH_P, CONSUMERUUID, or UP_API_KEY environment variables."
      );
    }

    return new DrupalClient({
      baseUrl: drupalUrl,
      auth: {
        type: "basic",
        username: httpAuthUsername,
        password: httpAuthPassword
      },
      headers: {
        "X-Consumer-ID": consumerId,
        "api-key": apiKey
      }
    });
  };

  it(
    "fetches upcoming events using a date comparison filter",
    async () => {
      const client =
        createTestClient();

      const today = new Date();

      today.setHours(
        0,
        0,
        0,
        0
      );

      const todayIso =
        today.toISOString();

      const response =
        await client
          .resource("node--event")
          .filter(
            "field_date.value",
            ">=",
            todayIso
          )
          .sort(
            "field_date.value"
          )
          .limit(5)
          .get();

      console.log(
        "\nDrupal integration test:"
      );

      console.log(
        "Today:",
        todayIso
      );

      console.log(
        "Upcoming events:",
        response.data.length
      );

      console.log(
        "Response:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      expect(response)
        .toHaveProperty("data");

      expect(
        Array.isArray(
          response.data
        )
      ).toBe(true);
    }
  );

  it(
    "serializes comparison filters using Drupal condition syntax",
    () => {
      const query =
        DrupalQueryBuilder
          .create("node--event")
          .filter(
            "field_date.value",
            ">=",
            "2026-08-13"
          );

      const params =
        DrupalQuerySerializer
          .serialize(query);

      expect(
        params.toString()
      ).toBe(
        "filter%5Bcondition_0%5D%5Bcondition%5D%5Bpath%5D=field_date.value&filter%5Bcondition_0%5D%5Bcondition%5D%5Boperator%5D=%3E%3D&filter%5Bcondition_0%5D%5Bcondition%5D%5Bvalue%5D=2026-08-13"
      );
    }
  );

  it(
    "retrieves the Drupal event collection without filters",
    async () => {
      const client =
        createTestClient();

      const response =
        await client
          .resource("node--event")
          .limit(5)
          .get();

      console.log(
        "\nDrupal event collection:"
      );

      console.log(
        "Event count:",
        response.data.length
      );

      console.log(
        "Response:",
        JSON.stringify(
          response,
          null,
          2
        )
      );

      expect(response)
        .toHaveProperty("data");

      expect(
        Array.isArray(
          response.data
        )
      ).toBe(true);
    }
  );
});