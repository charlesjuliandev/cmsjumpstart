import {
  describe,
  expect,
  it
} from "vitest";

import {
  getResourceCacheTags
} from "./cacheTags";

describe(
  "getResourceCacheTags",
  () => {
    it(
      "generates a collection cache tag",
      () => {
        expect(
          getResourceCacheTags(
            "node--page"
          )
        ).toEqual([
          "cmsjumpstart:drupal:node--page"
        ]);
      }
    );

    it(
      "generates collection and resource cache tags",
      () => {
        expect(
          getResourceCacheTags(
            "node--page",
            "123"
          )
        ).toEqual([
          "cmsjumpstart:drupal:node--page",
          "cmsjumpstart:drupal:node--page:123"
        ]);
      }
    );

    it(
      "generates deterministic tags",
      () => {
        const first =
          getResourceCacheTags(
            "node--article",
            "article-123"
          );

        const second =
          getResourceCacheTags(
            "node--article",
            "article-123"
          );

        expect(first)
          .toEqual(second);
      }
    );

    it(
      "supports different resource types",
      () => {
        expect(
          getResourceCacheTags(
            "media--image",
            "image-456"
          )
        ).toEqual([
          "cmsjumpstart:drupal:media--image",
          "cmsjumpstart:drupal:media--image:image-456"
        ]);
      }
    );

    it(
      "throws when the resource type is empty",
      () => {
        expect(
          () =>
            getResourceCacheTags("")
        ).toThrow(
          "Resource type is required to generate cache tags."
        );
      }
    );

    it(
      "throws when the resource ID is empty",
      () => {
        expect(
          () =>
            getResourceCacheTags(
              "node--page",
              ""
            )
        ).toThrow(
          "Resource ID cannot be empty when generating a resource cache tag."
        );
      }
    );
  }
);

