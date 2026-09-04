import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  revalidateResource
} from "./revalidateResource";

import {
  revalidateTag
} from "next/cache";

vi.mock(
  "next/cache",
  () => ({
    revalidateTag:
      vi.fn()
  })
);

describe(
  "revalidateResource",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "revalidates the resource collection",
      () => {
        revalidateResource(
          "node--page"
        );

        expect(
          revalidateTag
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          revalidateTag
        ).toHaveBeenCalledWith(
          "cmsjumpstart:drupal:node--page",
          "max"
        );
      }
    );

    it(
      "revalidates the resource collection and individual resource",
      () => {
        revalidateResource(
          "node--page",
          "123"
        );

        expect(
          revalidateTag
        ).toHaveBeenCalledTimes(
          2
        );

        expect(
          revalidateTag
        ).toHaveBeenNthCalledWith(
          1,
          "cmsjumpstart:drupal:node--page",
          "max"
        );

        expect(
          revalidateTag
        ).toHaveBeenNthCalledWith(
          2,
          "cmsjumpstart:drupal:node--page:123",
          "max"
        );
      }
    );

    it(
      "throws when the resource type is empty",
      () => {
        expect(() =>
          revalidateResource("")
        ).toThrow(
          "Resource type is required to generate cache tags."
        );

        expect(
          revalidateTag
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "throws when the resource ID is empty",
      () => {
        expect(() =>
          revalidateResource(
            "node--page",
            ""
          )
        ).toThrow(
          "Resource ID cannot be empty when generating a resource cache tag."
        );

        expect(
          revalidateTag
        ).not.toHaveBeenCalled();
      }
    );
  }
);

