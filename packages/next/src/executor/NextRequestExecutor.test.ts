import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  NextRequestExecutor
} from "./NextRequestExecutor";

describe(
  "NextRequestExecutor",
  () => {
    it(
      "executes a base Drupal request",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200,

                  headers: {
                    "content-type":
                      "application/vnd.api+json"
                  }
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com"
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        expect(
          fetchMock
        ).toHaveBeenCalledTimes(
          1
        );

        const [
          url,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(url).toEqual(
          new URL(
            "https://example.com/jsonapi/node/page"
          )
        );

        expect(
          init?.method
        ).toBe("GET");

        expect(
          init?.headers
        ).toEqual({
          Accept:
            "application/vnd.api+json"
        });

        fetchMock.mockRestore();
      }
    );

    it(
      "supports Drupal cache options",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              cache:
                "no-store"
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.cache
        ).toBe("no-store");

        fetchMock.mockRestore();
      }
    );

    it(
      "supports Next.js revalidation",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              revalidate:
                3600
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.revalidate
        ).toBe(3600);

        fetchMock.mockRestore();
      }
    );

    it(
      "supports Next.js cache tags",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              tags: [
                "custom-tag"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.tags
        ).toEqual([
          "custom-tag"
        ]);

        fetchMock.mockRestore();
      }
    );

    it(
      "supports revalidation and cache tags together",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              revalidate:
                3600,

              tags: [
                "custom-tag"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.revalidate
        ).toBe(3600);

        expect(
          init?.next?.tags
        ).toEqual([
          "custom-tag"
        ]);

        fetchMock.mockRestore();
      }
    );

    it(
      "preserves Drupal request headers",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            headers: {
              Authorization:
                "Basic test",

              "X-Consumer-ID":
                "consumer",

              "api-key":
                "key"
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.headers
        ).toMatchObject({
          Authorization:
            "Basic test",

          "X-Consumer-ID":
            "consumer",

          "api-key":
            "key"
        });

        fetchMock.mockRestore();
      }
    );

    it(
      "adds the resource collection cache tag",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            resourceType:
              "node--page"
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.tags
        ).toEqual([
          "cmsjumpstart:drupal:node--page"
        ]);

        fetchMock.mockRestore();
      }
    );

    it(
      "merges resource and application cache tags",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            resourceType:
              "node--page",

            request: {
              tags: [
                "custom-tag"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.tags
        ).toEqual([
          "cmsjumpstart:drupal:node--page",
          "custom-tag"
        ]);

        fetchMock.mockRestore();
      }
    );

    it(
      "removes duplicate cache tags",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            resourceType:
              "node--page",

            request: {
              tags: [
                "cmsjumpstart:drupal:node--page",
                "custom-tag",
                "custom-tag"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.tags
        ).toEqual([
          "cmsjumpstart:drupal:node--page",
          "custom-tag"
        ]);

        fetchMock.mockRestore();
      }
    );

    it(
      "does not add a resource tag without a resource type",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com"
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.next?.tags
        ).toBeUndefined();

        fetchMock.mockRestore();
      }
    );

    it(
      "enables force-cache for the underlying request",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com"
          });

        executor.enableCache();

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.cache
        ).toBe(
          "force-cache"
        );

        fetchMock.mockRestore();
      }
    );

    it(
      "enables force-cache when request options already exist",
      async () => {
        const fetchMock =
          vi
            .spyOn(
              globalThis,
              "fetch"
            )
            .mockResolvedValue(
              new Response(
                JSON.stringify({
                  data: []
                }),
                {
                  status: 200
                }
              )
            );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              tags: [
                "custom-tag"
              ]
            }
          });

        executor.enableCache();

        await executor.get(
          "/jsonapi/node/page"
        );

        const [
          ,
          init
        ] =
          fetchMock.mock.calls[0];

        expect(
          init?.cache
        ).toBe(
          "force-cache"
        );

        expect(
          init?.next?.tags
        ).toEqual([
          "custom-tag"
        ]);

        fetchMock.mockRestore();
      }
    );
  }
);

