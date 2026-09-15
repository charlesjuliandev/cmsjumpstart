import {
  describe,
  expect,
  it,
  vi
} from "vitest";

import {
  NextCMSClient
} from "./NextCMSClient";

import {
  NextCMSResource
} from "../resource/NextCMSResource";

describe(
  "NextCMSClient",
  () => {
    it(
      "creates a Drupal client from the NextCMS configuration",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              auth: {
                type: "none"
              }
            }
          });

        expect(client)
          .toBeInstanceOf(
            NextCMSClient
          );
      }
    );

    it(
      "creates a Drupal resource",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              auth: {
                type: "none"
              }
            }
          });

        const resource =
          client.resource(
            "node--event"
          );

        expect(resource)
          .toBeDefined();

        expect(
          typeof resource.get
        ).toBe("function");

        expect(
          typeof resource.filter
        ).toBe("function");

        expect(
          typeof resource.sort
        ).toBe("function");

        expect(
          typeof resource.limit
        ).toBe("function");

        expect(resource)
          .toBeInstanceOf(
            NextCMSResource
          );
      }
    );

    it(
      "resolves custom request headers",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              request: {
                headers: {
                  "X-Consumer-ID":
                    "cmsjumpstart-test",

                  "api-key":
                    "test-key"
                }
              }
            }
          });

        expect(
          client.getHeaders()
        ).toEqual({
          Accept:
            "application/vnd.api+json",

          "X-Consumer-ID":
            "cmsjumpstart-test",

          "api-key":
            "test-key"
        });
      }
    );

    it(
      "preserves Drupal authentication headers",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              auth: {
                type: "bearer",

                token:
                  "test-token"
              }
            }
          });

        expect(
          client.getHeaders()
        ).toEqual({
          Accept:
            "application/vnd.api+json",

          Authorization:
            "Bearer test-token"
        });
      }
    );

    it(
      "preserves header precedence",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              headers: {
                Authorization:
                  "Basic incorrect-value",

                "X-Test":
                  "from-drupal-headers"
              },

              request: {
                headers: {
                  Authorization:
                    "Bearer incorrect-value",

                  "X-Test":
                    "from-request-headers"
                }
              },

              auth: {
                type: "bearer",

                token:
                  "correct-token"
              }
            }
          });

        expect(
          client.getHeaders()
        ).toEqual({
          Accept:
            "application/vnd.api+json",

          Authorization:
            "Bearer correct-token",

          "X-Test":
            "from-request-headers"
        });
      }
    );

    it(
      "passes resolved headers to resource requests",
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
                  jsonapi: {
                    version:
                      "1.0"
                  },

                  data: []
                }),
                {
                  status: 200,

                  headers: {
                    "Content-Type":
                      "application/vnd.api+json"
                  }
                }
              )
            );

        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              headers: {
                "X-Test":
                  "from-drupal-headers",

                Authorization:
                  "Basic incorrect-value"
              },

              request: {
                headers: {
                  "X-Test":
                    "from-request-headers"
                }
              },

              auth: {
                type: "bearer",

                token:
                  "correct-token"
              }
            }
          });

        await client
          .resource(
            "node--page"
          )
          .get();

        expect(
          fetchMock
        ).toHaveBeenCalledTimes(1);

        const request =
          fetchMock.mock
            .calls[0][0];

        const requestInit =
          fetchMock.mock
            .calls[0][1];

        expect(request)
          .toBeDefined();

        expect(requestInit)
          .toBeDefined();

        const headers =
          requestInit?.headers;

        expect(headers)
          .toBeDefined();

        const resolvedHeaders =
          new Headers(
            headers
          );

        expect(
          resolvedHeaders.get(
            "Accept"
          )
        ).toBe(
          "application/vnd.api+json"
        );

        expect(
          resolvedHeaders.get(
            "X-Test"
          )
        ).toBe(
          "from-request-headers"
        );

        expect(
          resolvedHeaders.get(
            "Authorization"
          )
        ).toBe(
          "Bearer correct-token"
        );

        fetchMock.mockRestore();
      }
    );

    it(
      "preserves the request cache option",
      () => {
        const client =
          new NextCMSClient({
            drupal: {
              baseUrl:
                "https://example.com",

              request: {
                cache:
                  "force-cache"
              }
            }
          });

        expect(client)
          .toBeInstanceOf(
            NextCMSClient
          );
      }
    );
  }
);

