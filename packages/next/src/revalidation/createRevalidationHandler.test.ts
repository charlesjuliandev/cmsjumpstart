import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const {
  revalidateResourceMock
} = vi.hoisted(() => ({
  revalidateResourceMock:
    vi.fn()
}));

vi.mock(
  "./revalidateResource",
  () => ({
    revalidateResource:
      revalidateResourceMock
  })
);

import {
  createRevalidationHandler
} from "./createRevalidationHandler";

const SECRET =
  "test-revalidation-secret";

function createRequest(
  body: unknown,
  headers: Record<
    string,
    string
  > = {}
): Request {
  return new Request(
    "https://example.com/api/revalidate",
    {
      method: "POST",

      headers: {
        "content-type":
          "application/json",

        ...headers
      },

      body:
        JSON.stringify(body)
    }
  );
}

async function getJson(
  response: Response
): Promise<unknown> {
  return response.json();
}

describe(
  "createRevalidationHandler",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "throws when no secret is provided",
      () => {
        expect(() =>
          createRevalidationHandler({
            secret: ""
          })
        ).toThrow(
          "A revalidation secret is required."
        );
      }
    );

    it(
      "revalidates a specific resource",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {
                resource: {
                  type:
                    "node--page",

                  id: "123"
                }
              },
              {
                Authorization:
                  `Bearer ${SECRET}`
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResourceMock
        ).toHaveBeenCalledOnce();

        expect(
          revalidateResourceMock
        ).toHaveBeenCalledWith(
          "node--page",
          "123"
        );

        await expect(
          getJson(response)
        ).resolves.toEqual({
          revalidated: true,

          resource: {
            type: "node--page",

            id: "123"
          }
        });
      }
    );

    it(
      "revalidates a resource collection when no id is provided",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {
                resource: {
                  type:
                    "node--page"
                }
              },
              {
                Authorization:
                  `Bearer ${SECRET}`
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResourceMock
        ).toHaveBeenCalledOnce();

        expect(
          revalidateResourceMock
        ).toHaveBeenCalledWith(
          "node--page",
          undefined
        );

        await expect(
          getJson(response)
        ).resolves.toEqual({
          revalidated: true,

          resource: {
            type: "node--page"
          }
        });
      }
    );

    it(
      "returns 401 when authorization is missing",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest({
              resource: {
                type:
                  "node--page",
                id: "123"
              }
            })
          );

        expect(
          response.status
        ).toBe(401);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();

        await expect(
          getJson(response)
        ).resolves.toEqual({
          error:
            "Invalid revalidation secret."
        });
      }
    );

    it(
      "returns 401 when authorization is invalid",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {
                resource: {
                  type:
                    "node--page",
                  id: "123"
                }
              },
              {
                Authorization:
                  "Bearer wrong-secret"
              }
            )
          );

        expect(
          response.status
        ).toBe(401);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 400 for malformed JSON",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const request =
          new Request(
            "https://example.com/api/revalidate",
            {
              method: "POST",

              headers: {
                Authorization:
                  `Bearer ${SECRET}`,

                "content-type":
                  "application/json"
              },

              body: "{"
            }
          );

        const response =
          await handler(request);

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();

        await expect(
          getJson(response)
        ).resolves.toEqual({
          error:
            "Invalid JSON request body."
        });
      }
    );

    it(
      "returns 400 when the resource is missing",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {},

              {
                Authorization:
                  `Bearer ${SECRET}`
              }
            )
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();

        await expect(
          getJson(response)
        ).resolves.toEqual({
          error:
            "A valid resource is required."
        });
      }
    );

    it(
      "returns 400 when the resource type is invalid",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {
                resource: {
                  type: ""
                }
              },

              {
                Authorization:
                  `Bearer ${SECRET}`
              }
            )
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "returns 400 when the resource id is invalid",
      async () => {
        const handler =
          createRevalidationHandler({
            secret: SECRET
          });

        const response =
          await handler(
            createRequest(
              {
                resource: {
                  type:
                    "node--page",

                  id: ""
                }
              },

              {
                Authorization:
                  `Bearer ${SECRET}`
              }
            )
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResourceMock
        ).not.toHaveBeenCalled();
      }
    );
  }
);

