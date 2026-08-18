import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  DrupalResource
} from "./DrupalResource";

import {
  RequestExecutor
} from "../executor/RequestExecutor";

import type {
  DrupalJsonApiRelationship,
  DrupalResponse
} from "../types/DrupalResponse";

import {
  DrupalResourceResponse
} from "../response/DrupalResourceResponse";

describe("DrupalResource", () => {
  it("creates a resource query", () => {
    const resource =
      new DrupalResource("node--page");

    expect(
      resource
        .getQuery()
        .getResourceType()
    ).toBe("node--page");
  });

  it("supports query chaining", () => {
    const resource =
      new DrupalResource("node--page");

    resource
      .include("field_image")
      .filter("status", true)
      .sort("-created")
      .limit(10);

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.includes)
      .toEqual(["field_image"]);

    expect(options.filters)
      .toEqual([
        {
          field: "status",
          operator: "=",
          value: true
        }
      ]);

    expect(options.sort)
      .toEqual(["-created"]);

    expect(options.limit)
      .toBe(10);
  });

  it("supports sparse fieldsets", () => {
    const resource =
      new DrupalResource("node--event");

    resource.fields(
      "title",
      "field_date",
      "field_image"
    );

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.fields)
      .toEqual([
        "title",
        "field_date",
        "field_image"
      ]);
  });

  it("supports comparison filters", () => {
    const resource =
      new DrupalResource("node--event");

    resource.filter(
      "field_date.value",
      ">=",
      "2026-08-13"
    );

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.filters)
      .toEqual([
        {
          field: "field_date.value",
          operator: ">=",
          value: "2026-08-13"
        }
      ]);
  });

  it("supports multiple comparison filters", () => {
    const resource =
      new DrupalResource("node--event");

    resource
      .filter(
        "field_date.value",
        ">=",
        "2026-08-13"
      )
      .filter(
        "field_date.value",
        "<=",
        "2026-08-31"
      );

    const options =
      resource
        .getQuery()
        .getOptions();

    expect(options.filters)
      .toEqual([
        {
          field: "field_date.value",
          operator: ">=",
          value: "2026-08-13"
        },
        {
          field: "field_date.value",
          operator: "<=",
          value: "2026-08-31"
        }
      ]);
  });

  it("executes a Drupal JSON:API request", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        data: []
      })
    };

    const resource =
      new DrupalResource(
        "node--page",
        executor as unknown as RequestExecutor
      );

    const response =
      await resource
        .limit(10)
        .get();

    expect(response)
      .toBeInstanceOf(
        DrupalResourceResponse
      );

    const [
      path,
      params
    ] = executor.get.mock.calls[0];

    expect(path)
      .toBe("/jsonapi/node/page");

    expect(params)
      .toBeInstanceOf(URLSearchParams);
  });

  it("includes sparse fieldsets in Drupal JSON:API requests", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        data: []
      })
    };

    const resource =
      new DrupalResource(
        "node--event",
        executor as unknown as RequestExecutor
      );

    await resource
      .fields(
        "title",
        "field_date",
        "field_image"
      )
      .get();

    const [
      path,
      params
    ] = executor.get.mock.calls[0];

    expect(path)
      .toBe("/jsonapi/node/event");

    expect(
      params.get(
        "fields[node--event]"
      )
    ).toBe(
      "title,field_date,field_image"
    );
  });

  it("supports typed Drupal resource attributes", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        jsonapi: {
          version: "1.0"
        },

        data: [
          {
            type: "node--page",
            id: "123",

            attributes: {
              title: "Test Page",
              status: true
            }
          }
        ]
      })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource<{
        title: string;
        status: boolean;
      }>(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    expect(
      response.data[0]
        .attributes.title
    ).toBe("Test Page");

    expect(
      response.data[0]
        .attributes.status
    ).toBe(true);
  });

  it("returns a typed DrupalResourceResponse", async () => {
    type PageAttributes = {
      title: string;
      status: boolean;
    };

    const executor = {
      get: vi.fn().mockResolvedValue({
        jsonapi: {
          version: "1.0"
        },

        data: [
          {
            type: "node--page",
            id: "123",

            attributes: {
              title: "Test Page",
              status: true
            }
          }
        ]
      })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource<
        PageAttributes
      >(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    expect(response.length)
      .toBe(1);

    const item =
      response.getOne();

    expect(item)
      .not.toBeNull();

    expect(item?.id)
      .toBe("123");

    expect(item?.type)
      .toBe("node--page");

    expect(item?.attributes.title)
      .toBe("Test Page");

    expect(item?.attributes.status)
      .toBe(true);
  });

  it("supports getAll for typed resource items", async () => {
    type PageAttributes = {
      title: string;
    };

    const executor = {
      get: vi.fn().mockResolvedValue({
        jsonapi: {
          version: "1.0"
        },

        data: [
          {
            type: "node--page",
            id: "123",

            attributes: {
              title: "Page One"
            }
          },
          {
            type: "node--page",
            id: "456",

            attributes: {
              title: "Page Two"
            }
          }
        ]
      })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource<
        PageAttributes
      >(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    const items =
      response.getAll();

    expect(items)
      .toHaveLength(2);

    expect(items[0].id)
      .toBe("123");

    expect(items[0].attributes.title)
      .toBe("Page One");

    expect(items[1].id)
      .toBe("456");

    expect(items[1].attributes.title)
      .toBe("Page Two");
  });

  it("returns null when getOne is outside the response range", async () => {
    const executor = {
      get: vi.fn().mockResolvedValue({
        jsonapi: {
          version: "1.0"
        },

        data: []
      })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    expect(
      response.getOne()
    ).toBeNull();

    expect(
      response.getOne(10)
    ).toBeNull();
  });

  it("preserves the raw response through toJSON", async () => {
    const rawResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "123",

          attributes: {
            title: "Test Page"
          }
        }
      ]
    };

    const executor = {
      get: vi.fn().mockResolvedValue(
        rawResponse
      )
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--page",
        executor
      );

    const response =
      await resource.get();

    expect(
      response.toJSON()
    ).toBe(rawResponse);
  });

  it("resolves a typed included resource", () => {
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

    const resource =
      new DrupalResource<
        EventAttributes,
        EventRelationships,
        ImageAttributes
      >("node--event");

    const response: DrupalResponse<
      EventAttributes,
      EventRelationships,
      ImageAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
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
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-123",

          attributes: {
            name: "Event Image",
            alt: "Community event"
          }
        }
      ]
    };

    const image =
      resource.getIncludedResource(
        response,
        response.data[0]
          .relationships
          ?.field_image
      );

    expect(image?.attributes.name)
      .toBe("Event Image");

    expect(image?.attributes.alt)
      .toBe("Community event");
  });

  it("resolves typed included resources", () => {
    type ArticleAttributes = {
      title: string;
    };

    type ArticleRelationships = {
      field_tags: DrupalJsonApiRelationship;
    };

    type TagAttributes = {
      name: string;
    };

    const resource =
      new DrupalResource<
        ArticleAttributes,
        ArticleRelationships,
        TagAttributes
      >("node--article");

    const response: DrupalResponse<
      ArticleAttributes,
      ArticleRelationships,
      TagAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
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
        }
      ]
    };

    const tags =
      resource.getIncludedResources(
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

  it("returns null for an undefined relationship", () => {
    const resource =
      new DrupalResource("node--event");

    const response =
      {} as DrupalResponse;

    expect(
      resource.getIncludedResource(
        response,
        undefined
      )
    ).toBeNull();
  });

  it("returns an empty array for an undefined to-many relationship", () => {
    const resource =
      new DrupalResource("node--article");

    const response =
      {} as DrupalResponse;

    expect(
      resource.getIncludedResources(
        response,
        undefined
      )
    ).toEqual([]);
  });

  it("returns null for an empty to-one relationship", () => {
    const resource =
      new DrupalResource("node--event");

    const response =
      {} as DrupalResponse;

    const relationship:
      DrupalJsonApiRelationship = {
      data: null
    };

    expect(
      resource.getIncludedResource(
        response,
        relationship
      )
    ).toBeNull();
  });

  it("returns an empty array for an empty to-many relationship", () => {
    const resource =
      new DrupalResource("node--article");

    const response =
      {} as DrupalResponse;

    const relationship:
      DrupalJsonApiRelationship = {
      data: []
    };

    expect(
      resource.getIncludedResources(
        response,
        relationship
      )
    ).toEqual([]);
  });

  it("returns null when a related resource is not included", () => {
    type EventAttributes = {
      title: string;
    };

    type ImageAttributes = {
      name: string;
    };

    const resource =
      new DrupalResource<
        EventAttributes,
        Record<
          string,
          DrupalJsonApiRelationship
        >,
        ImageAttributes
      >("node--event");

    const response: DrupalResponse<
      EventAttributes,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      ImageAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-123",

          attributes: {
            title: "Community Event"
          }
        }
      ],

      included: []
    };

    const relationship:
      DrupalJsonApiRelationship = {
      data: {
        type: "media--image",
        id: "missing-image"
      }
    };

    expect(
      resource.getIncludedResource(
        response,
        relationship
      )
    ).toBeNull();
  });

  it("returns an empty array when included resources are missing", () => {
    type ArticleAttributes = {
      title: string;
    };

    type TagAttributes = {
      name: string;
    };

    const resource =
      new DrupalResource<
        ArticleAttributes,
        Record<
          string,
          DrupalJsonApiRelationship
        >,
        TagAttributes
      >("node--article");

    const response: DrupalResponse<
      ArticleAttributes,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      TagAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--article",
          id: "article-123",

          attributes: {
            title: "Drupal"
          }
        }
      ]
    };

    const relationship:
      DrupalJsonApiRelationship = {
      data: [
        {
          type: "taxonomy_term--tags",
          id: "tag-1"
        }
      ]
    };

    expect(
      resource.getIncludedResources(
        response,
        relationship
      )
    ).toEqual([]);
  });

  it("ignores missing resources in partially included to-many relationships", () => {
    type ArticleAttributes = {
      title: string;
    };

    type TagAttributes = {
      name: string;
    };

    const resource =
      new DrupalResource<
        ArticleAttributes,
        Record<
          string,
          DrupalJsonApiRelationship
        >,
        TagAttributes
      >("node--article");

    const response: DrupalResponse<
      ArticleAttributes,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      TagAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--article",
          id: "article-123",

          attributes: {
            title: "Drupal"
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
        }
      ]
    };

    const relationship:
      DrupalJsonApiRelationship = {
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
    };

    const tags =
      resource.getIncludedResources(
        response,
        relationship
      );

    expect(tags)
      .toHaveLength(1);

    expect(
      tags[0].attributes.name
    ).toBe("Drupal");
  });

  it("supports resolving relationships from multiple resources", () => {
    type EventAttributes = {
      title: string;
    };

    type ImageAttributes = {
      name: string;
    };

    const resource =
      new DrupalResource<
        EventAttributes,
        Record<
          string,
          DrupalJsonApiRelationship
        >,
        ImageAttributes
      >("node--event");

    const response: DrupalResponse<
      EventAttributes,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      ImageAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-1",

          attributes: {
            title: "Event One"
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-1"
              }
            }
          }
        },
        {
          type: "node--event",
          id: "event-2",

          attributes: {
            title: "Event Two"
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-2"
              }
            }
          }
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-1",

          attributes: {
            name: "Image One"
          }
        },
        {
          type: "media--image",
          id: "image-2",

          attributes: {
            name: "Image Two"
          }
        }
      ]
    };

    const firstImage =
      resource.getIncludedResource(
        response,
        response.data[0]
          .relationships
          ?.field_image
      );

    const secondImage =
      resource.getIncludedResource(
        response,
        response.data[1]
          .relationships
          ?.field_image
      );

    expect(
      firstImage?.attributes.name
    ).toBe("Image One");

    expect(
      secondImage?.attributes.name
    ).toBe("Image Two");
  });

  it("returns raw relationship data", () => {
    const resource =
      new DrupalResource("node--event");

    const relationship:
      DrupalJsonApiRelationship = {
      data: {
        type: "media--image",
        id: "image-123"
      }
    };

    expect(
      resource.relationshipData(
        relationship
      )
    ).toEqual({
      type: "media--image",
      id: "image-123"
    });
  });

  it("returns null for missing relationship data", () => {
    const resource =
      new DrupalResource("node--event");

    expect(
      resource.relationshipData(
        undefined
      )
    ).toBeNull();

    expect(
      resource.relationshipData({
        data: null
      })
    ).toBeNull();
  });

  it("supports pagination with a DrupalResourceResponse", async () => {
    type EventAttributes = {
      title: string;
    };

    type EventRelationships = {
      field_image: DrupalJsonApiRelationship;
    };

    type MediaAttributes = {
      name: string;
    };

    const firstResponse: DrupalResponse<
      EventAttributes,
      EventRelationships,
      MediaAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-123",

          attributes: {
            title: "First Page Event"
          }
        }
      ],

      links: {
        next: {
          href: "https://example.com/jsonapi/node/event?page[offset]=1"
        }
      }
    };

    const secondResponse:
      DrupalResponse<
        EventAttributes,
        EventRelationships,
        MediaAttributes
      > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-456",

          attributes: {
            title: "Second Page Event"
          }
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-456",

          attributes: {
            name: "Second Page Image"
          }
        }
      ]
    };

    const executor = {
      get: vi.fn(),

      getNext: vi.fn()
        .mockResolvedValue(
          secondResponse
        )
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource<
        EventAttributes,
        EventRelationships,
        MediaAttributes
      >(
        "node--event",
        executor
      );

    const response =
      new DrupalResourceResponse<
        EventAttributes,
        EventRelationships,
        MediaAttributes
      >(firstResponse);

    const nextResponse =
      await resource.next(response);

    expect(
      executor.getNext
    ).toHaveBeenCalledWith(
      firstResponse
    );

    expect(nextResponse)
      .toBeInstanceOf(
        DrupalResourceResponse
      );

    expect(
      nextResponse?.getOne()
        ?.attributes.title
    ).toBe(
      "Second Page Event"
    );

    expect(
      nextResponse?.included?.[0]
        .attributes.name
    ).toBe(
      "Second Page Image"
    );
  });

  it("supports pagination with a raw DrupalResponse", async () => {
    const response:
      DrupalResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-123"
        }
      ]
    };

    const executor = {
      get: vi.fn(),

      getNext: vi.fn()
        .mockResolvedValue({
          jsonapi: {
            version: "1.0"
          },

          data: []
        })
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--event",
        executor
      );

    await resource.next(response);

    expect(
      executor.getNext
    ).toHaveBeenCalledWith(
      response
    );
  });

  it("supports previous pagination with a DrupalResourceResponse", async () => {
    const firstResponse:
      DrupalResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-123"
        }
      ]
    };

    const previousResponse:
      DrupalResponse = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-456"
        }
      ]
    };

    const executor = {
      get: vi.fn(),

      getPrevious: vi.fn()
        .mockResolvedValue(
          previousResponse
        )
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--event",
        executor
      );

    const response =
      new DrupalResourceResponse(
        firstResponse
      );

    const result =
      await resource.previous(
        response
      );

    expect(
      executor.getPrevious
    ).toHaveBeenCalledWith(
      firstResponse
    );

    expect(result)
      .toBeInstanceOf(
        DrupalResourceResponse
      );

    expect(
      result?.getOne()?.id
    ).toBe("event-456");
  });

  it("returns null when there is no next page", async () => {
    const executor = {
      get: vi.fn(),

      getNext: vi.fn()
        .mockResolvedValue(null)
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--event",
        executor
      );

    const response =
      new DrupalResourceResponse({
        jsonapi: {
          version: "1.0"
        },

        data: []
      });

    const nextResponse =
      await resource.next(response);

    expect(nextResponse)
      .toBeNull();
  });

  it("returns null when there is no previous page", async () => {
    const executor = {
      get: vi.fn(),

      getPrevious: vi.fn()
        .mockResolvedValue(null)
    } as unknown as RequestExecutor;

    const resource =
      new DrupalResource(
        "node--event",
        executor
      );

    const response =
      new DrupalResourceResponse({
        jsonapi: {
          version: "1.0"
        },

        data: []
      });

    const previousResponse =
      await resource.previous(response);

    expect(previousResponse)
      .toBeNull();
  });
});