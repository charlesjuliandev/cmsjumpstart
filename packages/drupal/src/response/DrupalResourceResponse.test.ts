import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  DrupalResourceResponse
} from "./DrupalResourceResponse";

import {
  RequestExecutor
} from "../executor/RequestExecutor";

import type {
  DrupalJsonApiRelationship,
  DrupalResponse
} from "../types/DrupalResponse";

describe(
  "DrupalResourceResponse",
  () => {
    type EventAttributes = {
      title: string;
      status: boolean;
    };

    type EventRelationships = {
      field_image?: DrupalJsonApiRelationship;
      field_tags?: DrupalJsonApiRelationship;
    };

    type IncludedAttributes = {
      name: string;
    };

    const response: DrupalResponse<
      EventAttributes,
      EventRelationships,
      IncludedAttributes
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--event",
          id: "event-1",

          attributes: {
            title: "Community Event",
            status: true
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-1"
              }
            },

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
        },

        {
          type: "node--event",
          id: "event-2",

          attributes: {
            title: "Second Event",
            status: false
          },

          relationships: {
            field_image: {
              data: {
                type: "media--image",
                id: "image-2"
              }
            },

            field_tags: {
              data: [
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
          type: "media--image",
          id: "image-1",

          attributes: {
            name: "Event Image"
          }
        },

        {
          type: "media--image",
          id: "image-2",

          attributes: {
            name: "Second Event Image"
          }
        },

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

    it(
      "exposes the raw JSON:API response",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        expect(
          resourceResponse.data
        ).toBe(response.data);

        expect(
          resourceResponse.included
        ).toBe(response.included);

        expect(
          resourceResponse.jsonapi
        ).toEqual({
          version: "1.0"
        });
      }
    );

    it(
      "returns the number of resources",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        expect(
          resourceResponse.length
        ).toBe(2);
      }
    );

    it(
      "returns a typed resource by index",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        expect(event)
          .not
          .toBeNull();

        expect(event?.id)
          .toBe("event-1");

        expect(event?.type)
          .toBe("node--event");

        expect(event?.attributes.title)
          .toBe("Community Event");

        expect(event?.attributes.status)
          .toBe(true);
      }
    );

    it(
      "returns null for an invalid resource index",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        expect(
          resourceResponse.getOne(99)
        ).toBeNull();
      }
    );

    it(
      "returns all resources as typed items",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const events =
          resourceResponse.getAll();

        expect(events)
          .toHaveLength(2);

        expect(
          events.map(
            event =>
              event.attributes.title
          )
        ).toEqual([
          "Community Event",
          "Second Event"
        ]);
      }
    );

    it(
      "provides typed relationship data",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        expect(
          event?.relationship(
            "field_image"
          )
        ).toEqual({
          type: "media--image",
          id: "image-1"
        });
      }
    );

    it(
      "provides typed to-many relationship data",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        expect(
          event?.relationship(
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
      }
    );

    it(
      "resolves a typed included resource",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        const image =
          event?.includedResource(
            "field_image"
          );

        expect(
          image?.attributes.name
        ).toBe("Event Image");
      }
    );

    it(
      "resolves typed included resources",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        const tags =
          event?.includedResources(
            "field_tags"
          );

        expect(tags)
          .toHaveLength(2);

        expect(
          tags?.map(
            tag =>
              tag.attributes.name
          )
        ).toEqual([
          "Drupal",
          "Next.js"
        ]);
      }
    );

    it(
      "resolves relationships independently for multiple resources",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const events =
          resourceResponse.getAll();

        const firstImage =
          events[0].includedResource(
            "field_image"
          );

        const secondImage =
          events[1].includedResource(
            "field_image"
          );

        expect(
          firstImage?.attributes.name
        ).toBe("Event Image");

        expect(
          secondImage?.attributes.name
        ).toBe(
          "Second Event Image"
        );
      }
    );

    it(
      "returns null for a missing relationship",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        const event =
          resourceResponse.getOne(0);

        expect(
          event?.relationship(
            "missing" as keyof EventRelationships
          )
        ).toBeNull();
      }
    );

    it(
      "returns null when a to-one relationship is empty",
      () => {
        const emptyResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          ...response,

          data: [
            {
              ...response.data[0],

              relationships: {
                ...response.data[0]
                  .relationships,

                field_image: {
                  data: null
                }
              }
            }
          ]
        };

        const resourceResponse =
          new DrupalResourceResponse(
            emptyResponse
          );

        expect(
          resourceResponse
            .getOne(0)
            ?.includedResource(
              "field_image"
            )
        ).toBeNull();
      }
    );

    it(
      "returns an empty array for an empty to-many relationship",
      () => {
        const emptyResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          ...response,

          data: [
            {
              ...response.data[0],

              relationships: {
                ...response.data[0]
                  .relationships,

                field_tags: {
                  data: []
                }
              }
            }
          ]
        };

        const resourceResponse =
          new DrupalResourceResponse(
            emptyResponse
          );

        expect(
          resourceResponse
            .getOne(0)
            ?.includedResources(
              "field_tags"
            )
        ).toEqual([]);
      }
    );

    it(
      "returns null when an included resource is missing",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            {
              ...response,

              included: []
            }
          );

        const event =
          resourceResponse.getOne(0);

        expect(
          event?.includedResource(
            "field_image"
          )
        ).toBeNull();
      }
    );

    it(
      "returns an empty array when included resources are missing",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            {
              ...response,

              included: []
            }
          );

        const event =
          resourceResponse.getOne(0);

        expect(
          event?.includedResources(
            "field_tags"
          )
        ).toEqual([]);
      }
    );

    it(
      "preserves the original response through toJSON",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            response
          );

        expect(
          resourceResponse.toJSON()
        ).toBe(response);
      }
    );

    it(
      "returns null for an empty response",
      () => {
        const resourceResponse =
          new DrupalResourceResponse(
            {
              jsonapi: {
                version: "1.0"
              },

              data: []
            }
          );

        expect(
          resourceResponse.getOne()
        ).toBeNull();

        expect(
          resourceResponse.getAll()
        ).toEqual([]);

        expect(
          resourceResponse.length
        ).toBe(0);
      }
    );

    it(
      "loads the next page through the request executor",
      async () => {
        const nextResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          jsonapi: {
            version: "1.0"
          },

          data: [
            {
              type: "node--event",
              id: "event-3",

              attributes: {
                title: "Third Event",
                status: true
              }
            }
          ]
        };

        const executor = {
          getNext: vi
            .fn()
            .mockResolvedValue(
              nextResponse
            )
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse(
            response,
            executor
          );

        const next =
          await resourceResponse.next();

        expect(
          executor.getNext
        ).toHaveBeenCalledTimes(1);

        expect(
          executor.getNext
        ).toHaveBeenCalledWith(
          response
        );

        expect(next)
          .toBeInstanceOf(
            DrupalResourceResponse
          );

        expect(next?.length)
          .toBe(1);

        expect(
          next?.getOne()
            ?.attributes.title
        ).toBe("Third Event");
      }
    );

    it(
      "loads the previous page through the request executor",
      async () => {
        const previousResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          jsonapi: {
            version: "1.0"
          },

          data: [
            {
              type: "node--event",
              id: "event-0",

              attributes: {
                title: "Previous Event",
                status: false
              }
            }
          ]
        };

        const executor = {
          getPrevious: vi
            .fn()
            .mockResolvedValue(
              previousResponse
            )
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse(
            response,
            executor
          );

        const previous =
          await resourceResponse.previous();

        expect(
          executor.getPrevious
        ).toHaveBeenCalledTimes(1);

        expect(
          executor.getPrevious
        ).toHaveBeenCalledWith(
          response
        );

        expect(previous)
          .toBeInstanceOf(
            DrupalResourceResponse
          );

        expect(previous?.length)
          .toBe(1);

        expect(
          previous?.getOne()
            ?.attributes.title
        ).toBe(
          "Previous Event"
        );
      }
    );

    it(
      "returns null when there is no next page",
      async () => {
        const executor = {
          getNext: vi
            .fn()
            .mockResolvedValue(null)
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse(
            response,
            executor
          );

        const next =
          await resourceResponse.next();

        expect(
          executor.getNext
        ).toHaveBeenCalledWith(
          response
        );

        expect(next)
          .toBeNull();
      }
    );

    it(
      "returns null when there is no previous page",
      async () => {
        const executor = {
          getPrevious: vi
            .fn()
            .mockResolvedValue(null)
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse(
            response,
            executor
          );

        const previous =
          await resourceResponse.previous();

        expect(
          executor.getPrevious
        ).toHaveBeenCalledWith(
          response
        );

        expect(previous)
          .toBeNull();
      }
    );

    it(
      "preserves typed included resources through next-page pagination",
      async () => {
        const nextResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          jsonapi: {
            version: "1.0"
          },

          data: [
            {
              type: "node--event",
              id: "event-3",

              attributes: {
                title: "Third Event",
                status: true
              },

              relationships: {
                field_image: {
                  data: {
                    type: "media--image",
                    id: "image-3"
                  }
                }
              }
            }
          ],

          included: [
            {
              type: "media--image",
              id: "image-3",

              attributes: {
                name: "Third Event Image"
              }
            }
          ]
        };

        const executor = {
          getNext: vi
            .fn()
            .mockResolvedValue(
              nextResponse
            )
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          >(
            response,
            executor
          );

        const next =
          await resourceResponse.next();

        const event =
          next?.getOne();

        const image =
          event?.includedResource(
            "field_image"
          );

        expect(
          image?.attributes.name
        ).toBe(
          "Third Event Image"
        );
      }
    );

    it(
      "preserves typed included resources through previous-page pagination",
      async () => {
        const previousResponse:
          DrupalResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          > = {
          jsonapi: {
            version: "1.0"
          },

          data: [
            {
              type: "node--event",
              id: "event-0",

              attributes: {
                title: "Previous Event",
                status: false
              },

              relationships: {
                field_image: {
                  data: {
                    type: "media--image",
                    id: "image-0"
                  }
                }
              }
            }
          ],

          included: [
            {
              type: "media--image",
              id: "image-0",

              attributes: {
                name: "Previous Event Image"
              }
            }
          ]
        };

        const executor = {
          getPrevious: vi
            .fn()
            .mockResolvedValue(
              previousResponse
            )
        } as unknown as RequestExecutor;

        const resourceResponse =
          new DrupalResourceResponse<
            EventAttributes,
            EventRelationships,
            IncludedAttributes
          >(
            response,
            executor
          );

        const previous =
          await resourceResponse.previous();

        const event =
          previous?.getOne();

        const image =
          event?.includedResource(
            "field_image"
          );

        expect(
          image?.attributes.name
        ).toBe(
          "Previous Event Image"
        );
      }
    );
  }
);