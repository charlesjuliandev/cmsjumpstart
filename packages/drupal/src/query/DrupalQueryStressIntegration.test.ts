import { loadEnvFile } from "node:process";
import { describe, expect, it } from "vitest";
import { DrupalClient } from "../client/DrupalClient";
import type {
  DrupalToManyRelationship,
  DrupalToOneRelationship
} from "../types/DrupalResponse";

loadEnvFile(".env.local");

const drupalUrl = process.env.DRUPAL_BASE_URL;
const httpAuthUsername = process.env.HTAUTH_U;
const httpAuthPassword = process.env.HTAUTH_P;
const consumerId = process.env.CONSUMERUUID;
const apiKey = process.env.UP_API_KEY;

type DepartmentAttributes = {
  name: string;
};

type PersonAttributes = {
  name: string;
};

type LocationAttributes = {
  name: string;
};

type CourseAttributes = {
  title: string;
  field_course_code: string;
  field_credits: number;
  field_meeting_days: string;
  field_start_time: string;
  field_end_time: string;
  field_date: {
    value: string;
    end_value: string;
  };
  field_description: {
    value: string;
    format: string;
    processed: string;
  };
};

type CourseRelationships = {
  field_department: DrupalToOneRelationship<
    DepartmentAttributes
  >;

  field_instructor: DrupalToOneRelationship<
    PersonAttributes
  >;

  field_location: DrupalToOneRelationship<
    LocationAttributes
  >;

  field_prerequisites: DrupalToManyRelationship<
    CourseAttributes
  >;
};

describe("Drupal Course query stress integration", () => {
  const createTestClient = () => {
    if (
      !drupalUrl ||
      !httpAuthUsername ||
      !httpAuthPassword ||
      !consumerId ||
      !apiKey
    ) {
      throw new Error(
        "Missing DRUPAL_BASE_URL, HTAUTH_U, HTAUTH_P, CONSUMERUUID, or UP_API_KEY environment variables."
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

  it("filters real Courses using equality", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        "=",
        3
      )
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(4);

    expect(
      courses.every(
        course =>
          course.attributes.field_credits === 3
      )
    ).toBe(true);
  });

  it("returns an empty collection when a comparison matches nothing", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        ">",
        3
      )
      .get();

    expect(response.length).toBe(0);
    expect(response.getAll()).toEqual([]);
  });

  it("filters real Courses using a greater-than-or-equal comparison", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        ">=",
        3
      )
      .get();

    expect(response.length).toBe(4);
  });

  it("returns an empty collection for a less-than comparison with no matches", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        "<",
        3
      )
      .get();

    expect(response.length).toBe(0);
  });

  it("combines multiple filters against real Course data", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        "=",
        3
      )
      .filter(
        "field_course_code",
        "STARTS_WITH",
        "CS"
      )
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(3);

    expect(
      courses.map(
        course =>
          course.attributes.field_course_code
      )
    ).toEqual(
      expect.arrayContaining([
        "CS 101",
        "CS 201",
        "CS 301"
      ])
    );
  });

  it("sorts real Courses in ascending title order", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .sort("title")
      .get();

    const titles = response
      .getAll()
      .map(
        course =>
          course.attributes.title
      );

    expect(titles).toEqual([
      "Algorithms",
      "Data Structures",
      "Discrete Mathematics",
      "Introduction to Computer Science"
    ]);
  });

  it("sorts real Courses in descending title order", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .sort("-title")
      .get();

    const titles = response
      .getAll()
      .map(
        course =>
          course.attributes.title
      );

    expect(titles).toEqual([
      "Introduction to Computer Science",
      "Discrete Mathematics",
      "Data Structures",
      "Algorithms"
    ]);
  });

  it("combines filtering, sorting, and limiting", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        ">=",
        3
      )
      .sort("title")
      .limit(2)
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(2);

    expect(
      courses.map(
        course =>
          course.attributes.title
      )
    ).toEqual([
      "Algorithms",
      "Data Structures"
    ]);
  });

  it("combines filtering with sparse fieldsets", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_course_code",
        "=",
        "CS 301"
      )
      .fields(
        "title",
        "field_course_code"
      )
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(1);

    expect(
      courses[0]?.attributes.title
    ).toBe("Algorithms");

    expect(
      courses[0]?.attributes.field_course_code
    ).toBe("CS 301");
  });

  it("combines filtering with included relationships", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationships
      >("node--course")
      .filter(
        "field_course_code",
        "=",
        "CS 301"
      )
      .include(
        "field_department",
        "field_instructor",
        "field_location"
      )
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();
    expect(course?.attributes.title).toBe(
      "Algorithms"
    );

    expect(
      course?.includedResource(
        "field_department"
      )
    ).not.toBeNull();

    expect(
      course?.includedResource(
        "field_instructor"
      )
    ).not.toBeNull();

    expect(
      course?.includedResource(
        "field_location"
      )
    ).not.toBeNull();
  });

  it("combines multiple filters, sorting, limiting, and included relationships", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationships
      >("node--course")
      .filter(
        "field_credits",
        "=",
        3
      )
      .filter(
        "field_course_code",
        "STARTS_WITH",
        "CS"
      )
      .include(
        "field_department",
        "field_instructor",
        "field_location"
      )
      .sort("title")
      .limit(2)
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(2);

    expect(
      courses.map(
        course =>
          course.attributes.title
      )
    ).toEqual([
      "Algorithms",
      "Data Structures"
    ]);

    for (const course of courses) {
      expect(
        course.includedResource(
          "field_department"
        )
      ).not.toBeNull();

      expect(
        course.includedResource(
          "field_instructor"
        )
      ).not.toBeNull();

      expect(
        course.includedResource(
          "field_location"
        )
      ).not.toBeNull();
    }
  });
});