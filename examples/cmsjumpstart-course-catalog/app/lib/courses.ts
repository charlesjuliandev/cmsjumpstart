import {
  cacheLife,
  cacheTag
} from "next/cache";

import type {
  DrupalJsonApiRelationship,
  DrupalToManyRelationship,
  DrupalToOneRelationship
} from "@cmsjumpstart/drupal";

import {
  cms
} from "./cms";

export interface CourseAttributes
  extends Record<string, unknown> {
  title?: string;

  field_course_code?: string;

  field_credits?: number;

  field_date?: string;

  field_description?: {
    value?: string;

    summary?: string;

    processed?: string;

    format?: string;
  };

  field_end_time?: string;

  field_meeting_days?: string;

  field_start_time?: string;
}

export interface CourseIncludedAttributes
  extends Record<string, unknown> {
  title?: string;
}

export interface CourseRelationships
  extends Record<
    string,
    DrupalJsonApiRelationship
  > {
  field_department:
    DrupalJsonApiRelationship;

  field_instructor:
    DrupalJsonApiRelationship;

  field_location:
    DrupalJsonApiRelationship;

  field_prerequisites:
    DrupalJsonApiRelationship;
}

export interface CourseRelationshipDefinitions
  extends Record<
    string,
    | DrupalToOneRelationship<
        CourseIncludedAttributes
      >
    | DrupalToManyRelationship<
        CourseIncludedAttributes
      >
  > {
  field_department:
    DrupalToOneRelationship<
      CourseIncludedAttributes
    >;

  field_instructor:
    DrupalToOneRelationship<
      CourseIncludedAttributes
    >;

  field_location:
    DrupalToOneRelationship<
      CourseIncludedAttributes
    >;

  field_prerequisites:
    DrupalToManyRelationship<
      CourseIncludedAttributes
    >;
}

export interface CourseListItem {
  id: string;

  title: string;

  courseCode: string;

  credits: number | null;

  meetingDays: string;

  startTime: string;

  endTime: string;

  department: string;

  instructor: string;

  location: string;
}

export interface CourseDetail
  extends CourseListItem {
  description: string;

  prerequisites: Array<{
    id: string;

    title: string;
  }>;
}

function createDescription(
  value: unknown
): string {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return "";
  }

  const description =
    value as {
      value?: unknown;

      summary?: unknown;

      processed?: unknown;
    };

  const source =
    typeof description.processed ===
        "string" &&
      description.processed.trim()
      ? description.processed
      : typeof description.summary ===
            "string" &&
          description.summary.trim()
        ? description.summary
        : typeof description.value ===
              "string"
          ? description.value
          : "";

  if (!source) {
    return "";
  }

  return source
    .replace(
      /<[^>]*>/g,
      " "
    )
    .replace(
      /&nbsp;/gi,
      " "
    )
    .replace(
      /&amp;/gi,
      "&"
    )
    .replace(
      /&lt;/gi,
      "<"
    )
    .replace(
      /&gt;/gi,
      ">"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}

function getIncludedTitle(
  resource:
    | {
        attributes:
          CourseIncludedAttributes;
      }
    | null
): string {
  return String(
    resource?.attributes.title ??
      "Unknown"
  );
}

function mapCourseResponse(
  course: {
    id: string;

    attributes: CourseAttributes;

    includedResource: (
      relationship: keyof CourseRelationshipDefinitions
    ) => {
      attributes:
        CourseIncludedAttributes;
    } | null;
  }
): CourseListItem {
  return {
    id: course.id,

    title: String(
      course.attributes.title ??
        "Untitled Course"
    ),

    courseCode: String(
      course.attributes
        .field_course_code ??
        ""
    ),

    credits:
      typeof course.attributes
        .field_credits === "number"
        ? course.attributes.field_credits
        : null,

    meetingDays: String(
      course.attributes
        .field_meeting_days ??
        ""
    ),

    startTime: String(
      course.attributes
        .field_start_time ??
        ""
    ),

    endTime: String(
      course.attributes
        .field_end_time ??
        ""
    ),

    department:
      getIncludedTitle(
        course.includedResource(
          "field_department"
        )
      ),

    instructor:
      getIncludedTitle(
        course.includedResource(
          "field_instructor"
        )
      ),

    location:
      getIncludedTitle(
        course.includedResource(
          "field_location"
        )
      )
  };
}

function getCourseResource(
  id?: string,
  preview = false
) {
  let resource =
    cms.resource<
      CourseAttributes,
      CourseRelationships,
      CourseIncludedAttributes,
      CourseRelationshipDefinitions
    >("node--course");

  if (id !== undefined) {
    resource =
      resource.id(id);
  }

  if (preview) {
    resource =
      resource.resourceVersion(
        "rel:working-copy"
      );
  }

  return resource;
}

export async function getCourses(): Promise<
  CourseListItem[]
> {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--course"
  );

  const response =
    await getCourseResource()
      .fields(
        "title",
        "field_course_code",
        "field_credits",
        "field_meeting_days",
        "field_start_time",
        "field_end_time",
        "field_department",
        "field_instructor",
        "field_location"
      )
      .include(
        "field_department",
        "field_instructor",
        "field_location"
      )
      .sort(
        "field_course_code"
      )
      .limit(5)
      .get();

  return response
    .getAll()
    .map(mapCourseResponse);
}

export async function getCourse(
  id: string
): Promise<
  CourseDetail | null
> {
  "use cache";

  cacheLife("hours");

  cacheTag(
    "cmsjumpstart:drupal:node--course"
  );

  cacheTag(
    `cmsjumpstart:drupal:node--course:${id}`
  );

  return getCourseById(id);
}

async function getCourseById(
  id: string,
  preview = false
): Promise<
  CourseDetail | null
> {
  const response =
    await getCourseResource(
      id,
      preview
    )
      .fields(
        "title",
        "field_course_code",
        "field_credits",
        "field_description",
        "field_meeting_days",
        "field_start_time",
        "field_end_time",
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

  if (!course) {
    return null;
  }

  const listItem =
    mapCourseResponse(course);

  const prerequisites =
    course
      .includedResources(
        "field_prerequisites"
      )
      .map(prerequisite => ({
        id: prerequisite.id,

        title: String(
          prerequisite.attributes
            .title ??
            "Untitled Course"
        )
      }));

  return {
    ...listItem,

    description:
      createDescription(
        course.attributes
          .field_description
      ),

    prerequisites
  };
}

export async function getPreviewCourse(
  id: string
): Promise<
  CourseDetail | null
> {
  return getCourseById(
    id,
    true
  );
}

export async function getPreviewCourses(): Promise<
  CourseListItem[]
> {
  const response =
    await getCourseResource(
      undefined,
      true
    )
      .fields(
        "title",
        "field_course_code",
        "field_credits",
        "field_meeting_days",
        "field_start_time",
        "field_end_time",
        "field_department",
        "field_instructor",
        "field_location"
      )
      .include(
        "field_department",
        "field_instructor",
        "field_location"
      )
      .sort(
        "field_course_code"
      )
      .limit(5)
      .get();

  return response
    .getAll()
    .map(mapCourseResponse);
}