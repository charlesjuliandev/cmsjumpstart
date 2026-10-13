
import { loadEnvFile } from "node:process";
import { describe, expect, it } from "vitest";
import { DrupalClient } from "../client/DrupalClient";
import { DrupalQueryBuilder } from "./DrupalQueryBuilder";
import { DrupalQuerySerializer } from "./DrupalQuerySerializer";

loadEnvFile(".env.local");

const drupalUrl = process.env.DRUPAL_BASE_URL;
const httpAuthUsername = process.env.DRUPAL_USERNAME;
const httpAuthPassword = process.env.DRUPAL_PASSWORD;
const consumerId = process.env.CONSUMERUUID;
const apiKey = process.env.API_KEY;

interface CourseAttributes {
  title: string;
  field_date: {
    value: string;
    end_value: string;
  };
}

describe("Drupal JSON:API integration", () => {
  const createTestClient = () => {
    if (!drupalUrl || !httpAuthUsername || !httpAuthPassword) {
      throw new Error(
        "Missing DRUPAL_BASE_URL, DRUPAL_USERNAME, or DRUPAL_PASSWORD environment variables."
      );
    }

    const headers: Record<string, string> = {};

    if (consumerId) {
      headers["X-Consumer-ID"] = consumerId;
    }

    if (apiKey) {
      headers["api-key"] = apiKey;
    }

    return new DrupalClient({
      baseUrl: drupalUrl,
      auth: {
        type: "basic",
        username: httpAuthUsername,
        password: httpAuthPassword
      },
      ...(Object.keys(headers).length > 0 ? { headers } : {})
    });
  };

  it("filters courses using a date comparison filter", async () => {
    const client = createTestClient();

    // Use the existing Drupal fixture to choose a date cutoff.
    // This avoids depending on hard-coded dates or the current date.
    const collection = await client
      .resource<CourseAttributes>("node--course")
      .limit(10)
      .get();

    expect(collection.data.length).toBeGreaterThan(0);

    const courseDates = collection.data.map(
      course => course.attributes.field_date.value
    );

    expect(courseDates.every(date => Boolean(date))).toBe(true);

    const sortedDates = [...courseDates].sort();
    const cutoff = sortedDates[Math.floor(sortedDates.length / 2)];

    const expectedCourses = collection.data.filter(
      course => course.attributes.field_date.value >= cutoff
    );

    const response = await client
      .resource<CourseAttributes>("node--course")
      .filter("field_date.value", ">=", cutoff)
      .sort("field_date.value")
      .limit(10)
      .get();

    expect(response.data.length).toBeGreaterThan(0);

    // Confirm Drupal returned the same courses that satisfy the comparison.
    expect(response.data.map(course => course.id).sort()).toEqual(
      expectedCourses.map(course => course.id).sort()
    );

    // Confirm the requested sort order is applied.
    const responseDates = response.data.map(
      course => course.attributes.field_date.value
    );

    expect(responseDates).toEqual([...responseDates].sort());
  });

  it("serializes comparison filters using Drupal condition syntax", () => {
    const query = DrupalQueryBuilder.create("node--course").filter(
      "field_date.value",
      ">=",
      "2026-08-13"
    );

    const params = DrupalQuerySerializer.serialize(query);

    expect(params.toString()).toBe(
      "filter%5Bcondition_0%5D%5Bcondition%5D%5Bpath%5D=field_date.value&filter%5Bcondition_0%5D%5Bcondition%5D%5Boperator%5D=%3E%3D&filter%5Bcondition_0%5D%5Bcondition%5D%5Bvalue%5D=2026-08-13"
    );
  });

  it("retrieves the Drupal Course collection without filters", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>("node--course")
      .limit(10)
      .get();

    expect(response).toHaveProperty("data");
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.data).toHaveLength(4);

    expect(response.data.map(course => course.attributes.title)).toEqual(
      expect.arrayContaining([
        "Introduction to Computer Science",
        "Data Structures",
        "Discrete Mathematics",
        "Algorithms"
      ])
    );
  });
});
