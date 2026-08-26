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
      "executes a request using the base Drupal request behavior",
      async () => {
        const fetchMock =
          vi
            .fn()
            .mockResolvedValue({
              ok: true,

              json:
                vi.fn()
                  .mockResolvedValue({
                    data: []
                  })
            });

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com"
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            new URL(
              "https://example.com/jsonapi/node/page"
            ),
            expect.objectContaining({
              method: "GET",

              headers: {
                Accept:
                  "application/vnd.api+json"
              },

              signal:
                expect.any(
                  AbortSignal
                )
            })
          );

        vi.unstubAllGlobals();
      }
    );

    it(
      "passes Next.js revalidation options to fetch",
      async () => {
        const fetchMock =
          vi
            .fn()
            .mockResolvedValue({
              ok: true,

              json:
                vi.fn()
                  .mockResolvedValue({
                    data: []
                  })
            });

        vi.stubGlobal(
          "fetch",
          fetchMock
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

        expect(fetchMock)
          .toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({
              next: {
                revalidate:
                  3600
              }
            })
          );

        vi.unstubAllGlobals();
      }
    );

    it(
      "passes Next.js cache tags to fetch",
      async () => {
        const fetchMock =
          vi
            .fn()
            .mockResolvedValue({
              ok: true,

              json:
                vi.fn()
                  .mockResolvedValue({
                    data: []
                  })
            });

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              tags: [
                "events",
                "homepage"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({
              next: {
                tags: [
                  "events",
                  "homepage"
                ]
              }
            })
          );

        vi.unstubAllGlobals();
      }
    );

    it(
      "passes revalidation and cache tags together",
      async () => {
        const fetchMock =
          vi
            .fn()
            .mockResolvedValue({
              ok: true,

              json:
                vi.fn()
                  .mockResolvedValue({
                    data: []
                  })
            });

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            request: {
              revalidate:
                1800,

              tags: [
                "events"
              ]
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({
              next: {
                revalidate:
                  1800,

                tags: [
                  "events"
                ]
              }
            })
          );

        vi.unstubAllGlobals();
      }
    );

    it(
      "preserves Drupal request headers",
      async () => {
        const fetchMock =
          vi
            .fn()
            .mockResolvedValue({
              ok: true,

              json:
                vi.fn()
                  .mockResolvedValue({
                    data: []
                  })
            });

        vi.stubGlobal(
          "fetch",
          fetchMock
        );

        const executor =
          new NextRequestExecutor({
            baseUrl:
              "https://example.com",

            headers: {
              "X-Consumer-ID":
                "cmsjumpstart-test",

              "api-key":
                "test-key"
            },

            request: {
              revalidate:
                3600
            }
          });

        await executor.get(
          "/jsonapi/node/page"
        );

        expect(fetchMock)
          .toHaveBeenCalledWith(
            expect.any(URL),
            expect.objectContaining({
              headers: {
                Accept:
                  "application/vnd.api+json",

                "X-Consumer-ID":
                  "cmsjumpstart-test",

                "api-key":
                  "test-key"
              },

              next: {
                revalidate:
                  3600
              }
            })
          );

        vi.unstubAllGlobals();
      }
    );
  }
);
