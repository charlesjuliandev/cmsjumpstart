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

type CourseRelationshipDefinitions = {
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

describe("Drupal Course resource integration", () => {
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

  it("fetches the real Course collection from Drupal", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        {
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
        }
      >("node--course")
      .include(
        "field_department",
        "field_instructor",
        "field_location",
        "field_prerequisites"
      )
      .limit(10)
      .get();

    console.log(
      "\nCourse collection:"
    );

    console.log(
      "Course count:",
      response.length
    );

    expect(response.data).toBeDefined();
    expect(Array.isArray(response.data)).toBe(true);
    expect(response.length).toBe(4);

    const courses = response.getAll();

    expect(courses).toHaveLength(4);

    for (const course of courses) {
      expect(course.type).toBe("node--course");
      expect(course.id).toBeTruthy();
      expect(course.attributes).toBeDefined();
    }
  });

  it("resolves a real Course's to-one included relationships", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .id("fcef31e7-b408-45cb-8557-c8b447ac63db")
      .include(
        "field_department",
        "field_instructor",
        "field_location"
      )
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();

    expect(course?.type).toBe("node--course");
    expect(course?.attributes.title).toBe(
  "Introduction to Computer Science"
);

    const department =
      course?.includedResource(
        "field_department"
      );

    const instructor =
      course?.includedResource(
        "field_instructor"
      );

    const location =
      course?.includedResource(
        "field_location"
      );

    expect(department).not.toBeNull();
    expect(instructor).not.toBeNull();
    expect(location).not.toBeNull();

    expect(department?.type).toBe(
      "node--department"
    );

    expect(instructor?.type).toBe(
      "node--person"
    );

    expect(location?.type).toBe(
      "node--location"
    );

    console.log(
      "\nIntro CS relationships:"
    );

    console.log(
      "Department:",
      department?.attributes
    );

    console.log(
      "Instructor:",
      instructor?.attributes
    );

    console.log(
      "Location:",
      location?.attributes
    );
  });

  it("resolves a real Course's to-many prerequisites", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .id("9bf365ef-d2f0-4698-b199-81c46913944c")
      .include("field_prerequisites")
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();
    expect(course?.attributes.title).toBe(
      "Algorithms"
    );

    const prerequisites =
      course?.includedResources(
        "field_prerequisites"
      );

    expect(prerequisites).toHaveLength(2);

    expect(
      prerequisites?.map(
        prerequisite =>
          prerequisite.attributes.title
      )
    ).toEqual([
      "Data Structures",
      "Discrete Mathematics"
    ]);

    expect(
      prerequisites?.map(
        prerequisite =>
          prerequisite.type
      )
    ).toEqual([
      "node--course",
      "node--course"
    ]);

    console.log(
      "\nAlgorithms prerequisites:"
    );

    for (const prerequisite of prerequisites ?? []) {
      console.log(
        "-",
        prerequisite.attributes.title
      );
    }
  });

  it("returns an empty array for a real Course with no prerequisites", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .id("fcef31e7-b408-45cb-8557-c8b447ac63db")
      .include("field_prerequisites")
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();

    const prerequisites =
      course?.includedResources(
        "field_prerequisites"
      );

    expect(prerequisites).toEqual([]);
  });

  it("resolves the prerequisite chain across real Drupal resources", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .id("9bf365ef-d2f0-4698-b199-81c46913944c")
      .include("field_prerequisites")
      .get();

    const algorithms = response.getOne();

    expect(algorithms?.attributes.title).toBe(
      "Algorithms"
    );

    const prerequisites =
      algorithms?.includedResources(
        "field_prerequisites"
      );

    expect(prerequisites).toHaveLength(2);

    const dataStructures =
      prerequisites?.find(
        prerequisite =>
          prerequisite.attributes.title ===
          "Data Structures"
      );

    expect(dataStructures).toBeDefined();

    const dataStructuresRelationship =
      dataStructures?.relationshipLinkage(
        "field_prerequisites"
      );

    expect(
      Array.isArray(
        dataStructuresRelationship
      )
    ).toBe(true);

    expect(
      dataStructuresRelationship
    ).toHaveLength(1);

    expect(
      dataStructuresRelationship?.[0]?.type
    ).toBe("node--course");
  });

  it("fetches a single Course using a real Drupal UUID", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .id("03e0ea66-d605-4ae7-af4e-224c73af7d90")
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();
    expect(course?.type).toBe(
      "node--course"
    );
    expect(course?.id).toBe(
      "03e0ea66-d605-4ae7-af4e-224c73af7d90"
    );
    expect(course?.attributes.title).toBe(
      "Data Structures"
    );
    expect(
      course?.attributes.field_course_code
    ).toBe("CS 201");
  });

  it("fetches Course data using sparse fieldsets", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .fields(
        "title",
        "field_course_code",
        "field_credits"
      )
      .limit(4)
      .get();

    const courses = response.getAll();

    expect(courses).toHaveLength(4);

    for (const course of courses) {
      expect(course.attributes.title).toBeTruthy();
      expect(
        course.attributes.field_course_code
      ).toBeTruthy();
      expect(
        course.attributes.field_credits
      ).toBeDefined();
    }
  });

  it("fetches Course prerequisites with included resources and preserves raw JSON:API access", async () => {
    const client = createTestClient();

    const response = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .id("03e0ea66-d605-4ae7-af4e-224c73af7d90")
      .include("field_prerequisites")
      .get();

    const course = response.getOne();

    expect(course).not.toBeNull();

    const prerequisites =
      course?.includedResources(
        "field_prerequisites"
      );

    expect(prerequisites).toHaveLength(1);

    expect(
        prerequisites?.[0]?.attributes.title
    ).toBe(
        "Introduction to Computer Science"
    );

    const rawResponse =
      response.toJSON();

    expect(rawResponse.data).toBeDefined();

    expect(
      rawResponse.included
    ).toBeDefined();

    expect(
      rawResponse.included
    ).toHaveLength(1);
  });
});