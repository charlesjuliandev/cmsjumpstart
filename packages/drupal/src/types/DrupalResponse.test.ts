import {
  describe,
  expect,
  it
} from "vitest";

import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiRelationshipIdentifier,
  DrupalJsonApiToManyRelationshipLinkage,
  DrupalJsonApiToOneRelationshipLinkage
} from "./DrupalResponse";

describe("DrupalResponse relationship types", () => {
  it("supports to-one relationship linkage", () => {
    const linkage:
      DrupalJsonApiToOneRelationshipLinkage = {
      type: "media--image",
      id: "image-123"
    };

    expect(linkage).toEqual({
      type: "media--image",
      id: "image-123"
    });
  });

  it("supports an empty to-one relationship", () => {
    const linkage:
      DrupalJsonApiToOneRelationshipLinkage =
      null;

    expect(linkage).toBeNull();
  });

  it("supports to-many relationship linkage", () => {
    const linkage:
      DrupalJsonApiToManyRelationshipLinkage = [
      {
        type: "taxonomy_term--tags",
        id: "tag-1"
      },
      {
        type: "taxonomy_term--tags",
        id: "tag-2"
      }
    ];

    expect(linkage)
      .toHaveLength(2);
  });

  it("supports relationship metadata without changing linkage", () => {
    const relationship:
      DrupalJsonApiRelationship = {
      data: {
        type: "media--image",
        id: "image-123"
      },

      links: {
        related: {
          href:
            "https://example.com/related/image-123"
        }
      },

      meta: {
        custom: true
      }
    };

    expect(
      relationship.data
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });

    expect(
      relationship.meta
    ).toEqual({
      custom: true
    });
  });

  it("represents relationship linkage as resource identifiers", () => {
    const identifier:
      DrupalJsonApiRelationshipIdentifier = {
      type: "media--image",
      id: "image-123"
    };

    const relationship:
      DrupalJsonApiRelationship = {
      data: identifier
    };

    expect(
      relationship.data
    ).toBe(identifier);
  });
});