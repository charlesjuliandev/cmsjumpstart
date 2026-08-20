import {
  describe,
  expect,
  it
} from "vitest";

import {
  DrupalResourceItem
} from "./DrupalResourceItem";

import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiResource
} from "../types/DrupalResponse";

describe("DrupalResourceItem", () => {
  it("exposes resource properties", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
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
          href:
            "https://example.com/jsonapi/node/event/event-123"
        }
      },

      meta: {
        created: true
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(item.type)
      .toBe("node--event");

    expect(item.id)
      .toBe("event-123");

    expect(item.attributes.title)
      .toBe("Community Event");

    expect(
      item.relationships?.field_image
        .data
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });

    expect(item.links)
      .toEqual(resource.links);

    expect(item.meta)
      .toEqual(resource.meta);
  });

  it("preserves raw Drupal attribute data without normalization", () => {
    type EventAttributes = {
      title: string;

      field_image: {
        uri: {
          url: string;
        };

        width: number;
        height: number;

        styles: {
          thumbnail: string;
          medium: string;
          large: string;
        };

        focal_point: {
          x: number;
          y: number;
        };
      };
    };

    const attributes: EventAttributes = {
      title: "Community Event",

      field_image: {
        uri: {
          url: "https://example.com/images/event.jpg"
        },

        width: 2400,
        height: 1600,

        styles: {
          thumbnail:
            "https://example.com/images/event-thumbnail.jpg",

          medium:
            "https://example.com/images/event-medium.jpg",

          large:
            "https://example.com/images/event-large.jpg"
        },

        focal_point: {
          x: 48,
          y: 37
        }
      }
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes
      > = {
      type: "node--event",
      id: "event-123",

      attributes
    };

    const item =
      new DrupalResourceItem<
        EventAttributes
      >(
        resource,
        undefined
      );

    expect(item.attributes)
      .toBe(attributes);

    expect(
      item.attributes.field_image
    ).toEqual(
      attributes.field_image
    );

    expect(
      item.attributes.field_image
        .uri.url
    ).toBe(
      "https://example.com/images/event.jpg"
    );

    expect(
      item.attributes.field_image
        .width
    ).toBe(2400);

    expect(
      item.attributes.field_image
        .height
    ).toBe(1600);

    expect(
      item.attributes.field_image
        .styles
    ).toEqual({
      thumbnail:
        "https://example.com/images/event-thumbnail.jpg",

      medium:
        "https://example.com/images/event-medium.jpg",

      large:
        "https://example.com/images/event-large.jpg"
    });

    expect(
      item.attributes.field_image
        .focal_point
    ).toEqual({
      x: 48,
      y: 37
    });
  });

  it("exposes the complete raw relationship object", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
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
        }
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationships?.field_image
    ).toEqual(
      resource.relationships?.field_image
    );
  });

  it("returns raw to-one relationship linkage", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "image-123"
          }
        }
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_image"
      )
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });
  });

  it("returns raw to-many relationship linkage", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      },

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
    };

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_tags"
      )
    ).toEqual([
      {
        type: "taxonomy_term--tags",
        id: "tag-1"
      },
      {
        type: "taxonomy_term--tags",
        id: "tag-2"
      }
    ]);
  });

  it("returns null for a missing relationship linkage", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_image"
      )
    ).toBeNull();
  });

  it("resolves a to-one included resource as a DrupalResourceItem", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    type ImageAttributes = {
      name: string;
      alt: string;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "image-123"
          }
        }
      }
    };

    const included:
      DrupalJsonApiResource<
        ImageAttributes
      >[] = [
      {
        type: "media--image",
        id: "image-123",

        attributes: {
          name: "Event Image",
          alt: "Community event"
        }
      }
    ];

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships,
        ImageAttributes
      >(
        resource,
        included
      );

    const image =
      item.includedResource(
        "field_image"
      );

    expect(image)
      .toBeInstanceOf(
        DrupalResourceItem
      );

    expect(image?.type)
      .toBe("media--image");

    expect(image?.id)
      .toBe("image-123");

    expect(image?.attributes.name)
      .toBe("Event Image");

    expect(image?.attributes.alt)
      .toBe("Community event");
  });

  it("returns null when a to-one relationship is not included", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    type ImageAttributes = {
      name: string;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "missing-image"
          }
        }
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships,
        ImageAttributes
      >(
        resource,
        []
      );

    expect(
      item.includedResource(
        "field_image"
      )
    ).toBeNull();
  });

  it("returns null for an empty to-one relationship", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: null
        }
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_image"
      )
    ).toBeNull();

    expect(
      item.includedResource(
        "field_image"
      )
    ).toBeNull();
  });

  it("returns an empty array for a missing to-many relationship", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      }
    };

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_tags"
      )
    ).toBeNull();

    expect(
      item.includedResources(
        "field_tags"
      )
    ).toEqual([]);
  });

  it("returns an empty array for an empty to-many relationship", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      },

      relationships: {
        field_tags: {
          data: []
        }
      }
    };

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships
      >(
        resource,
        undefined
      );

    expect(
      item.relationshipLinkage(
        "field_tags"
      )
    ).toEqual([]);

    expect(
      item.includedResources(
        "field_tags"
      )
    ).toEqual([]);
  });

  it("resolves to-many included resources as DrupalResourceItems", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    type TagAttributes = {
      name: string;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      },

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
    };

    const included:
      DrupalJsonApiResource<
        TagAttributes
      >[] = [
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
      }
    ];

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships,
        TagAttributes
      >(
        resource,
        included
      );

    const tags =
      item.includedResources(
        "field_tags"
      );

    expect(tags)
      .toHaveLength(2);

    expect(tags[0])
      .toBeInstanceOf(
        DrupalResourceItem
      );

    expect(tags[1])
      .toBeInstanceOf(
        DrupalResourceItem
      );

    expect(
      tags.map(
        tag => tag.attributes.name
      )
    ).toEqual([
      "Drupal",
      "Next.js"
    ]);
  });

  it("ignores missing resources in a partially included to-many relationship", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    type TagAttributes = {
      name: string;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      },

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
    };

    const included:
      DrupalJsonApiResource<
        TagAttributes
      >[] = [
      {
        type: "taxonomy_term--tags",
        id: "tag-1",

        attributes: {
          name: "Drupal"
        }
      }
    ];

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships,
        TagAttributes
      >(
        resource,
        included
      );

    const tags =
      item.includedResources(
        "field_tags"
      );

    expect(tags)
      .toHaveLength(1);

    expect(tags[0].attributes.name)
      .toBe("Drupal");
  });

  it("returns an empty array when included resources are unavailable", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    type TagAttributes = {
      name: string;
    };

    const resource:
      DrupalJsonApiResource<
        ArticleAttributes,
        ArticleRelationships
      > = {
      type: "node--article",
      id: "article-123",

      attributes: {
        title: "Drupal and Next.js"
      },

      relationships: {
        field_tags: {
          data: [
            {
              type: "taxonomy_term--tags",
              id: "tag-1"
            }
          ]
        }
      }
    };

    const item =
      new DrupalResourceItem<
        ArticleAttributes,
        ArticleRelationships,
        TagAttributes
      >(
        resource,
        undefined
      );

    expect(
      item.includedResources(
        "field_tags"
      )
    ).toEqual([]);
  });

  it("returns an empty array when includedResources is called on a to-one relationship", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    type ImageAttributes = {
      name: string;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "image-123"
          }
        }
      }
    };

    const included:
      DrupalJsonApiResource<
        ImageAttributes
      >[] = [
      {
        type: "media--image",
        id: "image-123",

        attributes: {
          name: "Event Image"
        }
      }
    ];

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships,
        ImageAttributes
      >(
        resource,
        included
      );

    expect(
      item.includedResources(
        "field_image"
      )
    ).toEqual([]);
  });

  it("preserves the included collection for nested relationship traversal", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    type ImageAttributes = {
      name: string;
    };

    type ImageRelationships = {
      field_thumbnail: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "image-123"
          }
        }
      }
    };

    const included:
      DrupalJsonApiResource<
        ImageAttributes,
        ImageRelationships
      >[] = [
      {
        type: "media--image",
        id: "image-123",

        attributes: {
          name: "Event Image"
        },

        relationships: {
          field_thumbnail: {
            data: {
              type: "media--image",
              id: "thumbnail-123"
            }
          }
        }
      },

      {
        type: "media--image",
        id: "thumbnail-123",

        attributes: {
          name: "Thumbnail"
        }
      }
    ];

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships,
        ImageAttributes
      >(
        resource,
        included
      );

    const image =
      item.includedResource(
        "field_image"
      );

    expect(image)
      .toBeInstanceOf(
        DrupalResourceItem
      );

    expect(
      image?.relationshipLinkage(
        "field_thumbnail"
      )
    ).toEqual({
      type: "media--image",
      id: "thumbnail-123"
    });
  });

  it("serializes back to the raw JSON:API resource", () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    const resource:
      DrupalJsonApiResource<
        EventAttributes,
        EventRelationships
      > = {
      type: "node--event",
      id: "event-123",

      attributes: {
        title: "Community Event"
      },

      relationships: {
        field_image: {
          data: {
            type: "media--image",
            id: "image-123"
          }
        }
      }
    };

    const item =
      new DrupalResourceItem<
        EventAttributes,
        EventRelationships
      >(
        resource,
        undefined
      );

    expect(item.toJSON())
      .toEqual(resource);
  });
});