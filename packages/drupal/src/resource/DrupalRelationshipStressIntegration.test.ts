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
  process.env.DRUPAL_USERNAME;

const httpAuthPassword =
  process.env.DRUPAL_PASSWORD;

const consumerId =
  process.env.CONSUMERUUID;

const apiKey =
  process.env.API_KEY;

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
          "Missing DRUPAL_BASE_URL, DRUPAL_USERNAME, DRUPAL_PASSWORD, CONSUMERUUID, or API_KEY environment variables."
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
              "2528d272-3296-4838-a808-8c1803b0b471"
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
            .id("3f90d487-86a8-4739-ac93-edb2e22062de")
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
              "2528d272-3296-4838-a808-8c1803b0b471"
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
              "2528d272-3296-4838-a808-8c1803b0b471"
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
              "3f90d487-86a8-4739-ac93-edb2e22062de"
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
          "01fc13bf-590a-4093-ae89-1263f101247b"
        );

        expect(
          instructor?.id
        ).toBe(
          "be7886c8-35af-4db1-ad6e-afaf2b91ffe5"
        );

        expect(
          location?.id
        ).toBe(
          "cbe85d50-fa32-428e-88b5-ba347856314c"
        );
      }
    );

    it(
      "preserves relationships on included Course resources",
      async () => {
        const response =
          await courses()
            .id(
              "3f90d487-86a8-4739-ac93-edb2e22062de"
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
        .id("3f90d487-86a8-4739-ac93-edb2e22062de")
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
              "3f90d487-86a8-4739-ac93-edb2e22062de"
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
              "3f90d487-86a8-4739-ac93-edb2e22062de"
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
          id: "01fc13bf-590a-4093-ae89-1263f101247b"
        });

        expect(
          json.data.relationships
            ?.field_instructor?.data
        ).toMatchObject({
          type: "node--person",
          id: "be7886c8-35af-4db1-ad6e-afaf2b91ffe5"
        });

        expect(
          json.data.relationships
            ?.field_location?.data
        ).toMatchObject({
          type: "node--location",
          id: "cbe85d50-fa32-428e-88b5-ba347856314c"
        });

        expect(
          json.included
        ).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              type: "node--department",
              id: "01fc13bf-590a-4093-ae89-1263f101247b"
            }),
            expect.objectContaining({
              type: "node--person",
              id: "be7886c8-35af-4db1-ad6e-afaf2b91ffe5"
            }),
            expect.objectContaining({
              type: "node--location",
              id: "cbe85d50-fa32-428e-88b5-ba347856314c"
            })
          ])
        );
      }
    );
  }
);

