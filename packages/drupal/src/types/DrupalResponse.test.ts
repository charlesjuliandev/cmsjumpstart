import {
  describe,
  expect,
  it
} from "vitest";

import {
  getIncludedResource,
  getIncludedResources
} from "./DrupalResponse";

import type {
  DrupalResponse,
  DrupalJsonApiRelationship
} from "./DrupalResponse";

describe("DrupalResponse", () => {
  it("represents a Drupal JSON:API collection response", () => {
    const response: DrupalResponse<
      {
        title: string;
        status: boolean;
      },
      {
        field_image: DrupalJsonApiRelationship;
      },
      {
        name: string;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "3a5334d6-da3e-4a37-9327-d148ce4e1aec",

          attributes: {
            title: "Fountains",
            status: true
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-123"
              }
            }
          },

          links: {
            self: {
              href: "https://example.com/jsonapi/node/page/3a5334d6"
            }
          }
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-123",

          attributes: {
            name: "Fountains"
          }
        }
      ],

      links: {
        self: {
          href: "https://example.com/jsonapi/node/page"
        },

        next: {
          href: "https://example.com/jsonapi/node/page?page[offset]=5"
        }
      }
    };

    expect(
      response.jsonapi.version
    ).toBe("1.0");

    expect(
      response.data
    ).toHaveLength(1);

    expect(
      response.data[0].attributes.title
    ).toBe("Fountains");

    expect(
      response.data[0]
        .attributes.status
    ).toBe(true);

    expect(
      response.included
    ).toHaveLength(1);

    expect(
      response.links?.next
    ).toBeDefined();
  });

  it("resolves a single included relationship", () => {
    const response: DrupalResponse<
      Record<string, unknown>,
      {
        field_image: DrupalJsonApiRelationship;
      },
      {
        name: string;
        alt: string;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "page-123",

          attributes: {},

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-123"
              }
            }
          }
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-123",

          attributes: {
            name: "Fountains",
            alt: "Fountain image"
          }
        }
      ]
    };

    const image =
      getIncludedResource(
        response,
        response.data[0]
          .relationships
          ?.field_image
      );

    expect(image)
      .not.toBeNull();

    expect(image?.type)
      .toBe("media--image");

    expect(image?.attributes.name)
      .toBe("Fountains");

    expect(image?.attributes.alt)
      .toBe("Fountain image");
  });

  it("returns null when a relationship has no included resource", () => {
    const response: DrupalResponse<
      Record<string, unknown>,
      {
        field_image: DrupalJsonApiRelationship;
      },
      {
        name: string;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "page-123",

          attributes: {},

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "missing-image"
              }
            }
          }
        }
      ],

      included: []
    };

    const image =
      getIncludedResource(
        response,
        response.data[0]
          .relationships
          ?.field_image
      );

    expect(image)
      .toBeNull();
  });

  it("resolves multiple included relationship resources", () => {
    const response: DrupalResponse<
      Record<string, unknown>,
      {
        field_tags: DrupalJsonApiRelationship;
      },
      {
        name: string;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--article",
          id: "article-123",

          attributes: {},

          relationships: {
            field_tags: {
              data: [
                {
                  type: "taxonomy_term--tags",
                  id: "tag-1"
                },
                {
                  type: "taxonomy_term--tags",
                  id: "tag-2"
                }
              ]
            }
          }
        }
      ],

      included: [
        {
          type: "taxonomy_term--tags",
          id: "tag-1",

          attributes: {
            name: "Drupal"
          }
        },
        {
          type: "taxonomy_term--tags",
          id: "tag-2",

          attributes: {
            name: "Next.js"
          }
        },
        {
          type: "taxonomy_term--tags",
          id: "tag-3",

          attributes: {
            name: "Unrelated"
          }
        }
      ]
    };

    const tags =
      getIncludedResources(
        response,
        response.data[0]
          .relationships
          ?.field_tags
      );

    expect(tags)
      .toHaveLength(2);

    expect(
      tags.map(
        tag => tag.attributes.name
      )
    ).toEqual([
      "Drupal",
      "Next.js"
    ]);
  });

  it("returns an empty array for a missing multi-value relationship", () => {
    const response: DrupalResponse<
      Record<string, unknown>,
      {
        field_tags: DrupalJsonApiRelationship;
      },
      {
        name: string;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--article",
          id: "article-123",

          attributes: {},

          relationships: {
            field_tags: {
              data: null
            }
          }
        }
      ]
    };

    const tags =
      getIncludedResources(
        response,
        response.data[0]
          .relationships
          ?.field_tags
      );

    expect(tags)
      .toEqual([]);
  });
});