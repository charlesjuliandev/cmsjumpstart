import { config } from "dotenv";
import { describe, expect, it } from "vitest";

import { DrupalClient } from "../client/DrupalClient";
import { DrupalResourceResponse } from "../response/DrupalResourceResponse";
import type {
  DrupalToManyRelationship,
  DrupalToOneRelationship
} from "../types/DrupalResponse";

config({
  path: ".env.local"
});

const drupalUrl =
  process.env.DRUPAL_BASE_URL;

const httpAuthUsername =
  process.env.HTAUTH_U;

const httpAuthPassword =
  process.env.HTAUTH_P;

const consumerId =
  process.env.CONSUMERUUID;

const apiKey =
  process.env.UP_API_KEY;

type DepartmentAttributes = {
  title: string;
};

type PersonAttributes = {
  title: string;
};

type LocationAttributes = {
  title: string;
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
  field_department:
    DrupalToOneRelationship<
      DepartmentAttributes
    >;

  field_instructor:
    DrupalToOneRelationship<
      PersonAttributes
    >;

  field_location:
    DrupalToOneRelationship<
      LocationAttributes
    >;

  field_prerequisites:
    DrupalToManyRelationship<
      CourseAttributes
    >;
};

describe(
  "Drupal relationship stress integration",
  () => {
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
          username:
            httpAuthUsername,
          password:
            httpAuthPassword
        },
        headers: {
          "X-Consumer-ID":
            consumerId,
          "api-key": apiKey
        }
      });
    };

    const courses = () =>
      createTestClient().resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course");

    it(
      "resolves all three to-one relationships from a real Course",
      async () => {
        const response =
          await courses()
            .id(
              "fcef31e7-b408-45cb-8557-c8b447ac63db"
            )
            .include(
              "field_department",
              "field_instructor",
              "field_location"
            )
            .get();

        expect(response).toBeInstanceOf(
          DrupalResourceResponse
        );

        const course =
          response.getOne();

        expect(course).not.toBeNull();

        expect(
          course?.attributes.title
        ).toBe(
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

        expect(
          department?.type
        ).toBe("node--department");

        expect(
          department?.attributes.title
        ).toBe("Computer Science");

        expect(
          instructor?.type
        ).toBe("node--person");

        expect(
          instructor?.attributes.title
        ).toBe("Dr. Jane Smith");

        expect(
          location?.type
        ).toBe("node--location");

        expect(
          location?.attributes.title
        ).toBe(
          "Engineering Hall 204"
        );
      }
    );

    it("resolves multiple to-many prerequisites from a real Course", async () => {
        const response =
            await courses()
            .id("9bf365ef-d2f0-4698-b199-81c46913944c")
            .include("field_prerequisites")
            .get();

        console.log(
            JSON.stringify(
            response.toJSON(),
            null,
            2
            )
        );

        const course = response.getOne();

        expect(course).not.toBeNull();

        const prerequisites =
            course?.includedResources("field_prerequisites");

        expect(prerequisites).toHaveLength(2);

        expect(prerequisites?.map(resource => resource.attributes.title))
            .toEqual(expect.arrayContaining([
            "Data Structures",
            "Discrete Mathematics"
            ]));
    });

    it(
      "returns an empty array for an empty real to-many relationship",
      async () => {
        const response =
          await courses()
            .id(
              "fcef31e7-b408-45cb-8557-c8b447ac63db"
            )
            .include(
              "field_prerequisites"
            )
            .get();

        const course =
          response.getOne();

        expect(course).not.toBeNull();

        expect(
          course?.includedResources(
            "field_prerequisites"
          )
        ).toEqual([]);
      }
    );

    it(
      "resolves multiple relationship types from the same Course",
      async () => {
        const response =
          await courses()
            .id(
              "fcef31e7-b408-45cb-8557-c8b447ac63db"
            )
            .include(
              "field_department",
              "field_instructor",
              "field_location",
              "field_prerequisites"
            )
            .get();

        const course =
          response.getOne();

        expect(course).not.toBeNull();

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

        const prerequisites =
          course?.includedResources(
            "field_prerequisites"
          );

        expect(
          department?.attributes.title
        ).toBe("Computer Science");

        expect(
          instructor?.attributes.title
        ).toBe("Dr. Jane Smith");

        expect(
          location?.attributes.title
        ).toBe(
          "Engineering Hall 204"
        );

        expect(
          prerequisites
        ).toEqual([]);
      }
    );

    it(
      "preserves relationship linkage when included resources are loaded",
      async () => {
        const response =
          await courses()
            .id(
              "9bf365ef-d2f0-4698-b199-81c46913944c"
            )
            .include(
              "field_department",
              "field_instructor",
              "field_location",
              "field_prerequisites"
            )
            .get();

        const course =
          response.getOne();

        expect(course).not.toBeNull();

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

        const prerequisites =
          course?.includedResources(
            "field_prerequisites"
          );

        expect(
          department
        ).not.toBeNull();

        expect(
          instructor
        ).not.toBeNull();

        expect(
          location
        ).not.toBeNull();

        expect(
          prerequisites
        ).toHaveLength(2);

        expect(
          department?.id
        ).toBe(
          "6e372bc2-0126-4bc4-955c-1136b5c135bb"
        );

        expect(
          instructor?.id
        ).toBe(
          "4ed5b8a2-51dc-496d-ba03-ff214e184daa"
        );

        expect(
          location?.id
        ).toBe(
          "7810fb73-9d77-478f-8c58-5afdc8e52806"
        );
      }
    );

    it(
      "preserves relationships on included Course resources",
      async () => {
        const response =
          await courses()
            .id(
              "9bf365ef-d2f0-4698-b199-81c46913944c"
            )
            .include(
              "field_prerequisites"
            )
            .get();

        const course =
          response.getOne();

        expect(course).not.toBeNull();

        const prerequisites =
          course?.includedResources(
            "field_prerequisites"
          );

        expect(
          prerequisites
        ).toHaveLength(2);

        const prerequisiteTitles =
          prerequisites?.map(
            resource =>
              resource.attributes.title
          );

        expect(
          prerequisiteTitles
        ).toEqual(
          expect.arrayContaining([
            "Data Structures",
            "Discrete Mathematics"
          ])
        );

        for (
          const prerequisite
          of prerequisites ?? []
        ) {
          expect(
            prerequisite.relationships
          ).toBeDefined();
        }
      }
    );

    it(
      "resolves prerequisite relationship chain using real Drupal data",
      async () => {
        const query = courses()
        .id("9bf365ef-d2f0-4698-b199-81c46913944c")
        .include("field_prerequisites.field_prerequisites");

        const algorithmsResponse = await query.get();

        const algorithms =
          algorithmsResponse.getOne();

        expect(algorithms).not.toBeNull();

        const prerequisites =
          algorithms?.includedResources(
            "field_prerequisites"
          );

        expect(
          prerequisites
        ).toHaveLength(2);

        const dataStructures =
          prerequisites?.find(
            resource =>
              resource.attributes.title ===
              "Data Structures"
          );

        expect(
          dataStructures
        ).toBeDefined();

        const dataStructuresPrerequisites =
        dataStructures?.includedResources("field_prerequisites");

        expect(dataStructuresPrerequisites).toHaveLength(1);

        expect(
          dataStructuresPrerequisites?.[0]
            ?.attributes.title
        ).toBe(
          "Introduction to Computer Science"
        );
      }
    );

    it(
      "supports sparse fields on the primary Course while including relationships",
      async () => {
        const response =
          await courses()
            .id(
              "9bf365ef-d2f0-4698-b199-81c46913944c"
            )
            .fields(
              "title",
              "field_course_code",
              "field_department",
              "field_instructor",
              "field_location",
              "field_prerequisites"
            )
            .include(
              "field_department",
              "field_instructor",
              "field_location",
              "field_prerequisites"
            )
            .get();

        const course =
          response.getOne();

        expect(course).not.toBeNull();

        expect(
          course?.attributes.title
        ).toBe("Algorithms");

        expect(
          course?.attributes.field_course_code
        ).toBe("CS 301");

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

        const prerequisites =
          course?.includedResources(
            "field_prerequisites"
          );

        expect(
          department
        ).not.toBeNull();

        expect(
          instructor
        ).not.toBeNull();

        expect(
          location
        ).not.toBeNull();

        expect(
          prerequisites
        ).toHaveLength(2);

        expect(
          department?.attributes.title
        ).toBe("Computer Science");

        expect(
          instructor?.attributes.title
        ).toBe("Dr. Jane Smith");

        expect(
          location?.attributes.title
        ).toBe(
          "Science Building 101"
        );
      }
    );

    it(
      "preserves raw JSON:API relationship and included data",
      async () => {
        const response =
          await courses()
            .id(
              "9bf365ef-d2f0-4698-b199-81c46913944c"
            )
            .include(
              "field_department",
              "field_instructor",
              "field_location",
              "field_prerequisites"
            )
            .get();

        const json =
          response.toJSON();

        expect(
          json.data
        ).toBeDefined();

        expect(
          json.data.relationships
        ).toBeDefined();

        expect(
          json.included
        ).toBeDefined();

        expect(
          json.data.relationships
            ?.field_department?.data
        ).toMatchObject({
          type: "node--department",
          id: "6e372bc2-0126-4bc4-955c-1136b5c135bb"
        });

        expect(
          json.data.relationships
            ?.field_instructor?.data
        ).toMatchObject({
          type: "node--person",
          id: "4ed5b8a2-51dc-496d-ba03-ff214e184daa"
        });

        expect(
          json.data.relationships
            ?.field_location?.data
        ).toMatchObject({
          type: "node--location",
          id: "7810fb73-9d77-478f-8c58-5afdc8e52806"
        });

        expect(
          json.included
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "node--department",
              id: "6e372bc2-0126-4bc4-955c-1136b5c135bb"
            }),
            expect.objectContaining({
              type: "node--person",
              id: "4ed5b8a2-51dc-496d-ba03-ff214e184daa"
            }),
            expect.objectContaining({
              type: "node--location",
              id: "7810fb73-9d77-478f-8c58-5afdc8e52806"
            })
          ])
        );
      }
    );
  }
);

