import {
  createHmac
} from "node:crypto";

import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const {
  revalidateResource
} = vi.hoisted(() => ({
  revalidateResource:
    vi.fn()
}));

vi.mock(
  "./revalidateResource",
  () => ({
    revalidateResource
  })
);

import {
  createRevalidationHandler
} from "./createRevalidationHandler";

const secret =
  "test-webhook-secret";

function createSignature(
  body: string
): string {
  return `sha256=${createHmac(
    "sha256",
    secret
  )
    .update(body, "utf8")
    .digest("hex")}`;
}

function createRequest(
  body: string,
  headers:
    | Record<string, string>
    | undefined = undefined
): Request {
  return new Request(
    "http://localhost/api/revalidate",
    {
      method: "POST",

      headers,

      body
    }
  );
}

describe(
  "createRevalidationHandler",
  () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it(
      "requires a revalidation secret",
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
      "revalidates a specific CMSJumpstart resource",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page",
              id: "page-123"
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                Authorization:
                  `Bearer ${secret}`
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResource
        ).toHaveBeenCalledWith(
          "node--page",
          "page-123"
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          revalidated: true,

          resource: {
            type: "node--page",
            id: "page-123"
          }
        });
      }
    );

    it(
      "revalidates a CMSJumpstart resource collection",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page"
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                Authorization:
                  `Bearer ${secret}`
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResource
        ).toHaveBeenCalledWith(
          "node--page",
          undefined
        );
      }
    );

    it(
      "accepts a valid Drupal Webhooks node update",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:node:update",

            entity: {
              uuid: [
                {
                  value:
                    "a91cc128-82be-48b0-bc4d-8a5ac678323b"
                }
              ],

              type: [
                {
                  target_id:
                    "page"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResource
        ).toHaveBeenCalledWith(
          "node--page",
          "a91cc128-82be-48b0-bc4d-8a5ac678323b"
        );

        await expect(
          response.json()
        ).resolves.toEqual({
          revalidated: true,

          resource: {
            type: "node--page",
            id: "a91cc128-82be-48b0-bc4d-8a5ac678323b"
          }
        });
      }
    );

    it(
      "accepts a valid Drupal Webhooks node create",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:node:create",

            entity: {
              uuid: [
                {
                  value:
                    "node-create-123"
                }
              ],

              type: [
                {
                  target_id:
                    "page"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResource
        ).toHaveBeenCalledWith(
          "node--page",
          "node-create-123"
        );
      }
    );

    it(
      "accepts a valid Drupal Webhooks node delete",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:node:delete",

            entity: {
              uuid: [
                {
                  value:
                    "node-delete-123"
                }
              ],

              type: [
                {
                  target_id:
                    "page"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(200);

        expect(
          revalidateResource
        ).toHaveBeenCalledWith(
          "node--page",
          "node-delete-123"
        );
      }
    );

    it(
      "rejects requests without authentication",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page",
              id: "123"
            }
          });

        const response =
          await handler(
            createRequest(body)
          );

        expect(
          response.status
        ).toBe(401);

        expect(
          revalidateResource
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an invalid bearer token",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page",
              id: "123"
            }
          });

        const response =
          await handler(
            createRequest(
              body,
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
          revalidateResource
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an invalid HMAC signature",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page",
              id: "123"
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  "sha256=" +
                  "0".repeat(64)
              }
            )
          );

        expect(
          response.status
        ).toBe(401);

        expect(
          revalidateResource
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a malformed HMAC signature",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            resource: {
              type: "node--page",
              id: "123"
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  "sha256=invalid"
              }
            )
          );

        expect(
          response.status
        ).toBe(401);
      }
    );

    it(
      "rejects malformed JSON",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          "{invalid-json";

        const response =
          await handler(
            createRequest(
              body,
              {
                Authorization:
                  `Bearer ${secret}`
              }
            )
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResource
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a payload without a resource",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "some:event"
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                Authorization:
                  `Bearer ${secret}`
              }
            )
          );

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "rejects a Drupal webhook without a UUID",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:node:update",

            entity: {
              type: [
                {
                  target_id:
                    "page"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "rejects a Drupal webhook without a node bundle",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:node:update",

            entity: {
              uuid: [
                {
                  value:
                    "node-123"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(400);
      }
    );

    it(
      "rejects unsupported Drupal webhook events",
      async () => {
        const handler =
          createRevalidationHandler({
            secret
          });

        const body =
          JSON.stringify({
            event:
              "entity:user:update",

            entity: {
              uuid: [
                {
                  value:
                    "user-123"
                }
              ],

              type: [
                {
                  target_id:
                    "user"
                }
              ]
            }
          });

        const response =
          await handler(
            createRequest(
              body,
              {
                "X-Hub-Signature-256":
                  createSignature(
                    body
                  )
              }
            )
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          revalidateResource
        ).not.toHaveBeenCalled();
      }
    );
  }
);

