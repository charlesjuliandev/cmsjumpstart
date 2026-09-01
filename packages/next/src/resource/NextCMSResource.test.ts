import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import type {
  DrupalResource
} from "@cmsjumpstart/drupal";

import {
  DrupalResourceResponse
} from "@cmsjumpstart/drupal";

import {
  NextCMSResource
} from "./NextCMSResource";

describe(
  "NextCMSResource",
  () => {
    const createResource =
      () => {
        return {
          include: vi.fn(),
          fields: vi.fn(),
          filter: vi.fn(),
          sort: vi.fn(),
          page: vi.fn(),
          limit: vi.fn(),
          getQuery: vi.fn(),
          get: vi.fn(),
          next: vi.fn(),
          previous: vi.fn(),
          relationshipData: vi.fn(),
          getIncludedResource:
            vi.fn(),
          getIncludedResources:
            vi.fn(),
          includedResource:
            vi.fn(),
          includedResources:
            vi.fn()
        } as unknown as DrupalResource;
      };

    it(
      "wraps a Drupal resource",
      () => {
        const resource =
          createResource();

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource
        ).toBeInstanceOf(
          NextCMSResource
        );
      }
    );

    it(
      "preserves fluent query methods",
      () => {
        const resource =
          createResource();

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.include(
            "field_image"
          )
        ).toBe(nextResource);

        expect(
          nextResource.fields(
            "title"
          )
        ).toBe(nextResource);

        expect(
          nextResource.filter(
            "status",
            true
          )
        ).toBe(nextResource);

        expect(
          nextResource.sort(
            "-created"
          )
        ).toBe(nextResource);

        expect(
          nextResource.page(2)
        ).toBe(nextResource);

        expect(
          nextResource.limit(10)
        ).toBe(nextResource);
      }
    );

    it(
      "delegates query methods to DrupalResource",
      () => {
        const resource =
          createResource();

        const nextResource =
          new NextCMSResource(
            resource
          );

        nextResource.include(
          "field_image",
          "field_author"
        );

        nextResource.fields(
          "title",
          "created"
        );

        nextResource.filter(
          "title",
          "CONTAINS",
          "Drupal"
        );

        nextResource.sort(
          "-created",
          "title"
        );

        nextResource.page(2);

        nextResource.limit(10);

        expect(
          resource.include
        ).toHaveBeenCalledWith(
          "field_image",
          "field_author"
        );

        expect(
          resource.fields
        ).toHaveBeenCalledWith(
          "title",
          "created"
        );

        expect(
          resource.filter
        ).toHaveBeenCalledWith(
          "title",
          "CONTAINS",
          "Drupal"
        );

        expect(
          resource.sort
        ).toHaveBeenCalledWith(
          "-created",
          "title"
        );

        expect(
          resource.page
        ).toHaveBeenCalledWith(
          2
        );

        expect(
          resource.limit
        ).toHaveBeenCalledWith(
          10
        );
      }
    );

    it(
      "delegates getQuery to DrupalResource",
      () => {
        const query =
          {};

        const resource =
          createResource();

        resource.getQuery =
          vi.fn().mockReturnValue(
            query
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.getQuery()
        ).toBe(query);

        expect(
          resource.getQuery
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "delegates get to DrupalResource",
      async () => {
        const response =
          {
            data: []
          };

        const resource =
          createResource();

        resource.get =
          vi.fn()
            .mockResolvedValue(
              response
            );

        const nextResource =
          new NextCMSResource(
            resource
          );

        await expect(
          nextResource.get()
        ).resolves.toBe(
          response
        );

        expect(
          resource.get
        ).toHaveBeenCalledTimes(
          1
        );
      }
    );

    it(
      "delegates next with a raw Drupal response",
      async () => {
        const response = {
          data: [],
          links: {
            next: {
              href:
                "https://example.com/next"
            }
          }
        };

        const nextResponse = {
          data: [
            {
              type: "node--page",
              id: "123"
            }
          ]
        };

        const resource =
          createResource();

        resource.next =
          vi.fn()
            .mockResolvedValue(
              nextResponse
            );

        const nextResource =
          new NextCMSResource(
            resource
          );

        await expect(
          nextResource.next(
            response
          )
        ).resolves.toBe(
          nextResponse
        );

        expect(
          resource.next
        ).toHaveBeenCalledWith(
          response
        );
      }
    );

    it(
      "delegates next with a DrupalResourceResponse",
      async () => {
        const rawResponse = {
          data: [],
          links: {
            next: {
              href:
                "https://example.com/next"
            }
          }
        };

        const nextResponse = {
          data: [
            {
              type: "node--page",
              id: "123"
            }
          ]
        };

        const resource =
          createResource();

        resource.next =
          vi.fn()
            .mockResolvedValue(
              nextResponse
            );

        const nextResource =
          new NextCMSResource(
            resource
          );

        const response =
          new DrupalResourceResponse(
            rawResponse,
            {} as never
          );

        await expect(
          nextResource.next(
            response
          )
        ).resolves.toBe(
          nextResponse
        );

        expect(
          resource.next
        ).toHaveBeenCalledWith(
          rawResponse
        );
      }
    );

    it(
      "delegates previous with a raw Drupal response",
      async () => {
        const response = {
          data: [],
          links: {
            prev: {
              href:
                "https://example.com/previous"
            }
          }
        };

        const previousResponse = {
          data: [
            {
              type: "node--page",
              id: "123"
            }
          ]
        };

        const resource =
          createResource();

        resource.previous =
          vi.fn()
            .mockResolvedValue(
              previousResponse
            );

        const nextResource =
          new NextCMSResource(
            resource
          );

        await expect(
          nextResource.previous(
            response
          )
        ).resolves.toBe(
          previousResponse
        );

        expect(
          resource.previous
        ).toHaveBeenCalledWith(
          response
        );
      }
    );

    it(
      "delegates previous with a DrupalResourceResponse",
      async () => {
        const rawResponse = {
          data: [],
          links: {
            prev: {
              href:
                "https://example.com/previous"
            }
          }
        };

        const previousResponse = {
          data: [
            {
              type: "node--page",
              id: "123"
            }
          ]
        };

        const resource =
          createResource();

        resource.previous =
          vi.fn()
            .mockResolvedValue(
              previousResponse
            );

        const nextResource =
          new NextCMSResource(
            resource
          );

        const response =
          new DrupalResourceResponse(
            rawResponse,
            {} as never
          );

        await expect(
          nextResource.previous(
            response
          )
        ).resolves.toBe(
          previousResponse
        );

        expect(
          resource.previous
        ).toHaveBeenCalledWith(
          rawResponse
        );
      }
    );

    it(
      "delegates relationshipData",
      () => {
        const relationship = {
          data: {
            type: "media--image",
            id: "image-123"
          }
        };

        const resource =
          createResource();

        resource.relationshipData =
          vi.fn().mockReturnValue(
            relationship.data
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.relationshipData(
            relationship
          )
        ).toEqual(
          relationship.data
        );

        expect(
          resource.relationshipData
        ).toHaveBeenCalledWith(
          relationship
        );
      }
    );

    it(
      "delegates relationshipData with a response",
      () => {
        const response = {
          data: []
        };

        const relationship = {
          data: {
            type: "media--image",
            id: "image-123"
          }
        };

        const resource =
          createResource();

        resource.relationshipData =
          vi.fn().mockReturnValue(
            relationship.data
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.relationshipData(
            response,
            relationship
          )
        ).toEqual(
          relationship.data
        );

        expect(
          resource.relationshipData
        ).toHaveBeenCalledWith(
          response,
          relationship
        );
      }
    );

    it(
      "delegates getIncludedResource",
      () => {
        const response = {
          data: [],
          included: []
        };

        const relationship = {
          data: {
            type: "media--image",
            id: "image-123"
          }
        };

        const included = {
          type: "media--image",
          id: "image-123",
          attributes: {
            name: "Test Image"
          }
        };

        const resource =
          createResource();

        resource.getIncludedResource =
          vi.fn().mockReturnValue(
            included
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.getIncludedResource(
            response,
            relationship
          )
        ).toBe(included);

        expect(
          resource.getIncludedResource
        ).toHaveBeenCalledWith(
          response,
          relationship
        );
      }
    );

    it(
      "delegates getIncludedResources",
      () => {
        const response = {
          data: [],
          included: []
        };

        const relationship = {
          data: [
            {
              type: "media--image",
              id: "image-123"
            }
          ]
        };

        const included = [
          {
            type: "media--image",
            id: "image-123",
            attributes: {
              name: "Test Image"
            }
          }
        ];

        const resource =
          createResource();

        resource.getIncludedResources =
          vi.fn().mockReturnValue(
            included
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.getIncludedResources(
            response,
            relationship
          )
        ).toBe(included);

        expect(
          resource.getIncludedResources
        ).toHaveBeenCalledWith(
          response,
          relationship
        );
      }
    );

    it(
      "delegates includedResource",
      () => {
        const response = {
          data: [],
          included: []
        };

        const included = {
          type: "media--image",
          id: "image-123",
          attributes: {
            name: "Test Image"
          }
        };

        const resource =
          createResource();

        resource.includedResource =
          vi.fn().mockReturnValue(
            included
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.includedResource(
            response,
            "field_image"
          )
        ).toBe(included);

        expect(
          resource.includedResource
        ).toHaveBeenCalledWith(
          response,
          "field_image"
        );
      }
    );

    it(
      "delegates includedResources",
      () => {
        const response = {
          data: [],
          included: []
        };

        const included = [
          {
            type: "media--image",
            id: "image-123",
            attributes: {
              name: "Test Image"
            }
          }
        ];

        const resource =
          createResource();

        resource.includedResources =
          vi.fn().mockReturnValue(
            included
          );

        const nextResource =
          new NextCMSResource(
            resource
          );

        expect(
          nextResource.includedResources(
            response,
            "field_images"
          )
        ).toBe(included);

        expect(
          resource.includedResources
        ).toHaveBeenCalledWith(
          response,
          "field_images"
        );
      }
    );
  }
);

