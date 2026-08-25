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
          "field_image"
        );

        nextResource.fields(
          "title"
        );

        nextResource.filter(
          "status",
          true
        );

        nextResource.sort(
          "-created"
        );

        nextResource.page(2);

        nextResource.limit(10);

        expect(
          resource.include
        ).toHaveBeenCalledWith(
          "field_image"
        );

        expect(
          resource.fields
        ).toHaveBeenCalledWith(
          "title"
        );

        expect(
          resource.filter
        ).toHaveBeenCalledWith(
          "status",
          true
        );

        expect(
          resource.sort
        ).toHaveBeenCalledWith(
          "-created"
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
  }
);

