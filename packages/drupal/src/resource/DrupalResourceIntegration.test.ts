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

    console.log("\nCourse collection:");
    console.log("Course count:", response.length);

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

    console.log("\nIntro CS relationships:");
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

    console.log("\nAlgorithms prerequisites:");

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

  it("reports a length of one for a single Course response", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .id("03e0ea66-d605-4ae7-af4e-224c73af7d90")
      .get();

    expect(response.length).toBe(1);
    expect(response.getAll()).toHaveLength(1);
    expect(response.getOne()?.attributes.title).toBe(
      "Data Structures"
    );
  });

  it("keeps getOne and getAll consistent for a single Course response", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .id("03e0ea66-d605-4ae7-af4e-224c73af7d90")
      .get();

    const one = response.getOne();
    const all = response.getAll();

    expect(one).toBeDefined();
    expect(all).toHaveLength(1);

    expect(all[0]?.type).toBe(one?.type);
    expect(all[0]?.id).toBe(one?.id);
    expect(all[0]?.attributes).toEqual(
      one?.attributes
    );

    expect(all[0]?.id).toBe(
      "03e0ea66-d605-4ae7-af4e-224c73af7d90"
    );
  });

  it("preserves the raw JSON:API response for a single Course", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .id("03e0ea66-d605-4ae7-af4e-224c73af7d90")
      .get();

    const rawResponse =
      response.toJSON();

    expect(rawResponse.data).toBeDefined();
    expect(Array.isArray(rawResponse.data)).toBe(
      false
    );

    expect(rawResponse.data).toMatchObject({
      type: "node--course",
      id: "03e0ea66-d605-4ae7-af4e-224c73af7d90",
      attributes: {
        title: "Data Structures",
        field_course_code: "CS 201"
      }
    });
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

  it("paginates through a real Drupal Course collection", async () => {
    const client = createTestClient();

    const firstPage = await client
      .resource<CourseAttributes>("node--course")
      .page(0)
      .limit(2)
      .get();

    expect(firstPage.getAll()).toHaveLength(2);

    const firstPageIds = firstPage
      .getAll()
      .map(course => course.id);

    const firstPageTitles = firstPage
      .getAll()
      .map(course => course.attributes.title);

    const secondPage = await firstPage.next();

    expect(secondPage).not.toBeNull();
    expect(secondPage?.getAll()).toHaveLength(2);

    const secondPageIds = secondPage
      ?.getAll()
      .map(course => course.id);

    const secondPageTitles = secondPage
      ?.getAll()
      .map(course => course.attributes.title);

    expect(secondPageIds).not.toEqual(
      firstPageIds
    );

    expect(secondPageTitles).not.toEqual(
      firstPageTitles
    );

    const previousPage =
      await secondPage?.previous();

    expect(previousPage).not.toBeNull();
    expect(previousPage?.getAll()).toHaveLength(2);

    expect(
      previousPage?.getAll().map(
        course => course.id
      )
    ).toEqual(firstPageIds);

    expect(
      previousPage?.getAll().map(
        course => course.attributes.title
      )
    ).toEqual(firstPageTitles);
  });

  it("returns the full Course collection when the page limit exceeds the collection size", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(0)
      .limit(100)
      .get();

    expect(response.getAll()).toHaveLength(4);
  });

  it("returns the final partial page of a real Course collection", async () => {
    const client = createTestClient();

    const firstPage = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(0)
      .limit(3)
      .get();

    expect(firstPage.getAll()).toHaveLength(3);

    const secondPage = await firstPage.next();

    expect(secondPage).not.toBeNull();
    expect(secondPage?.getAll()).toHaveLength(1);
  });

  it("returns an empty collection when paginating beyond the end", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(10)
      .limit(2)
      .get();

    expect(response.getAll()).toEqual([]);
    expect(response.length).toBe(0);
  });

  it("returns an empty collection consistently through the response helpers", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(10)
      .limit(2)
      .get();

    expect(response.length).toBe(0);
    expect(response.getAll()).toEqual([]);
    expect(response.getOne()).toBeNull();
  });

  it("returns null from next() on the final Course page", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(1)
      .limit(3)
      .get();

    expect(response.getAll()).toHaveLength(1);

    const nextPage = await response.next();

    expect(nextPage).toBeNull();
  });

  it("returns null from previous() on the first Course page", async () => {
    const client = createTestClient();

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .page(0)
      .limit(3)
      .get();

    expect(response.getAll()).toHaveLength(3);

    const previousPage =
      await response.previous();

    expect(previousPage).toBeNull();
  });

  it("returns a fully usable DrupalResourceResponse from next()", async () => {
    const client = createTestClient();

    const firstPage = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .sort("title")
      .page(0)
      .limit(2)
      .get();

    const secondPage = await firstPage.next();

    expect(secondPage).not.toBeNull();
    expect(secondPage?.length).toBe(2);
    expect(secondPage?.getAll()).toHaveLength(2);
    expect(
      secondPage?.getOne()?.attributes.title
    ).toBe("Discrete Mathematics");

    const rawResponse =
      secondPage?.toJSON();

    expect(rawResponse?.data).toBeDefined();
    expect(Array.isArray(rawResponse?.data)).toBe(
      true
    );
    expect(rawResponse?.data).toHaveLength(2);
  });

  it("preserves filtering and sorting while paginating through Courses", async () => {
    const client = createTestClient();

    const firstPage = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .filter(
        "field_credits",
        ">=",
        3
      )
      .sort("title")
      .page(0)
      .limit(2)
      .get();

    expect(firstPage.getAll()).toHaveLength(2);

    expect(
      firstPage
        .getAll()
        .map(
          course =>
            course.attributes.field_credits
        )
    ).toEqual([3, 3]);

    const firstPageTitles = firstPage
      .getAll()
      .map(course => course.attributes.title);

    const secondPage = await firstPage.next();

    expect(secondPage).not.toBeNull();
    expect(secondPage?.getAll()).toHaveLength(2);

    const secondPageTitles = secondPage
      ?.getAll()
      .map(course => course.attributes.title);

    expect(secondPageTitles).not.toEqual(
      firstPageTitles
    );

    expect(
      secondPage?.getAll().every(
        course =>
          course.attributes.field_credits >= 3
      )
    ).toBe(true);

    expect(
      secondPageTitles
    ).toEqual([
      "Discrete Mathematics",
      "Introduction to Computer Science"
    ]);
  });

  it("throws a useful error when fetching a nonexistent Course", async () => {
    const client = createTestClient();

    await expect(
      client
        .resource<CourseAttributes>(
          "node--course"
        )
        .id(
          "00000000-0000-0000-0000-000000000000"
        )
        .get()
    ).rejects.toThrow(
      /Request failed with status 404/
    );
  });

  it("throws a useful error when requesting a nonexistent resource endpoint", async () => {
    const client = createTestClient();

    await expect(
      client
        .resource<CourseAttributes>(
          "node--does-not-exist"
        )
        .get()
    ).rejects.toThrow(
      /Request failed with status (400|404)/
    );
  });

  it("returns an empty collection with authorization metadata when the API key is invalid", async () => {
    if (
      !drupalUrl ||
      !httpAuthUsername ||
      !httpAuthPassword ||
      !consumerId
    ) {
      throw new Error(
        "Missing DRUPAL_BASE_URL, HTAUTH_U, HTAUTH_P, or CONSUMERUUID environment variables."
      );
    }

    const client =
      new DrupalClient({
        baseUrl: drupalUrl,
        auth: {
          type: "basic",
          username: httpAuthUsername,
          password: httpAuthPassword
        },
        headers: {
          "X-Consumer-ID": consumerId,
          "api-key": "invalid-api-key"
        }
      });

    const response = await client
      .resource<CourseAttributes>(
        "node--course"
      )
      .get();

    expect(response.data).toEqual([]);
    expect(response.length).toBe(0);

    const rawResponse =
      response.toJSON();

    expect(rawResponse.meta).toMatchObject({
      omitted: {
        detail: expect.stringContaining(
          "Some resources have been omitted because of insufficient authorization."
        )
      }
    });
  });

  it("handles a combined real-world Course query with filtering, sorting, sparse fields, relationships, and pagination", async () => {
    const client = createTestClient();

    const firstPage = await client
      .resource<
        CourseAttributes,
        CourseRelationshipDefinitions
      >("node--course")
      .filter(
        "field_credits",
        ">=",
        3
      )
      .sort("-title")
      .fields(
        "title",
        "field_course_code",
        "field_credits",
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
      .page(0)
      .limit(2)
      .get();

    const firstPageCourses =
      firstPage.getAll();

    expect(firstPage.length).toBe(2);
    expect(firstPageCourses).toHaveLength(2);

    expect(
      firstPageCourses.map(
        course => course.attributes.title
      )
    ).toEqual([
      "Introduction to Computer Science",
      "Discrete Mathematics"
    ]);

    for (const course of firstPageCourses) {
      expect(course.type).toBe(
        "node--course"
      );
      expect(course.id).toBeTruthy();

      expect(
        course.attributes.title
      ).toBeTruthy();

      expect(
        course.attributes.field_course_code
      ).toBeTruthy();

      expect(
        course.attributes.field_credits
      ).toBe(3);

      const department =
        course.includedResource(
          "field_department"
        );

      const instructor =
        course.includedResource(
          "field_instructor"
        );

      const location =
        course.includedResource(
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
    }

    const rawFirstPage =
      firstPage.toJSON();

    expect(
      rawFirstPage.data
    ).toBeDefined();

    expect(
      Array.isArray(rawFirstPage.data)
    ).toBe(true);

    expect(
      rawFirstPage.included
    ).toBeDefined();

    expect(
      rawFirstPage.included?.length
    ).toBeGreaterThan(0);

    const secondPage =
      await firstPage.next();

    expect(secondPage).not.toBeNull();
    expect(secondPage?.length).toBe(2);

    const secondPageCourses =
      secondPage?.getAll() ?? [];

    expect(
      secondPageCourses.map(
        course => course.attributes.title
      )
    ).toEqual([
      "Data Structures",
      "Algorithms"
    ]);

    for (const course of secondPageCourses) {
      expect(
        course.attributes.field_credits
      ).toBe(3);

      expect(
        course.attributes.title
      ).toBeTruthy();

      expect(
        course.attributes.field_course_code
      ).toBeTruthy();

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

    const dataStructures =
      secondPageCourses.find(
        course =>
          course.attributes.title ===
          "Data Structures"
      );

    expect(dataStructures).toBeDefined();

    const dataStructuresPrerequisites =
      dataStructures?.includedResources(
        "field_prerequisites"
      );

    expect(
      dataStructuresPrerequisites
    ).toHaveLength(1);

    expect(
      dataStructuresPrerequisites?.[0]?.attributes.title
    ).toBe(
      "Introduction to Computer Science"
    );

    const algorithms =
      secondPageCourses.find(
        course =>
          course.attributes.title ===
          "Algorithms"
      );

    expect(algorithms).toBeDefined();

    const algorithmPrerequisites =
      algorithms?.includedResources(
        "field_prerequisites"
      );

    expect(
      algorithmPrerequisites
    ).toHaveLength(2);

    expect(
      algorithmPrerequisites?.map(
        prerequisite =>
          prerequisite.attributes.title
      )
    ).toEqual([
      "Data Structures",
      "Discrete Mathematics"
    ]);

    const rawSecondPage =
      secondPage?.toJSON();

    expect(
      rawSecondPage?.data
    ).toBeDefined();

    expect(
      Array.isArray(rawSecondPage?.data)
    ).toBe(true);

    expect(
      rawSecondPage?.included
    ).toBeDefined();

    expect(
      rawSecondPage?.included?.length
    ).toBeGreaterThan(0);
  });
});

