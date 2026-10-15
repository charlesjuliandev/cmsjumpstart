import {
  beforeEach,
  describe,
  expect,
  it,
  vi
} from "vitest";

const mocks =
  vi.hoisted(() => ({
    enable:
      vi.fn(),

    redirect:
      vi.fn(
        (
          path: string
        ): never => {
          throw new Error(
            `REDIRECT:${path}`
          );
        }
      )
  }));

vi.mock(
  "next/headers",
  () => ({
    draftMode:
      vi.fn().mockResolvedValue({
        isEnabled: false,
        enable:
          mocks.enable
      })
  })
);

vi.mock(
  "next/navigation",
  () => ({
    redirect:
      mocks.redirect
  })
);

import {
  createPreviewHandler
} from "./createPreviewHandler";

const previewSecret =
  "correct-secret";

function createPreviewRequest(
  options: {
    method?: string;
    path?: string;
    secret?: string;
    url?: string;
    body?: string;
  } = {}
): Request {
  const {
    method = "POST",
    path = "/",
    secret = previewSecret,
    url = "https://example.com/preview",
    body
  } = options;

  const headers =
    new Headers();

  if (secret) {
    headers.set(
      "Authorization",
      `Bearer ${secret}`
    );
  }

  const requestOptions: RequestInit = {
    method,
    headers
  };

  if (
    body !== undefined
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );

    requestOptions.body = body;
  } else if (
    method !== "GET" &&
    method !== "HEAD"
  ) {
    headers.set(
      "Content-Type",
      "application/json"
    );

    requestOptions.body =
      JSON.stringify({
        path
      });
  }

  return new Request(
    url,
    requestOptions
  );
}

describe(
  "createPreviewHandler",
  () => {
    beforeEach(() => {
      mocks.enable.mockClear();
      mocks.redirect.mockClear();
    });

    it(
      "requires a preview secret",
      () => {
        expect(() =>
          createPreviewHandler({
            secret: ""
          })
        ).toThrow(
          "A preview secret is required."
        );
      }
    );

    it(
      "rejects methods other than POST",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              method: "GET"
            })
          );

        expect(
          response.status
        ).toBe(405);

        expect(
          response.headers.get("Allow")
        ).toBe("POST");

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects preview secrets supplied in the URL",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              url:
                "https://example.com/preview?secret=correct-secret"
            })
          );

        expect(
          response.status
        ).toBe(400);

        await expect(
          response.text()
        ).resolves.toBe(
          "Do not send preview secrets in the URL."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an invalid bearer token",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              secret: "wrong-secret"
            })
          );

        expect(
          response.status
        ).toBe(401);

        await expect(
          response.text()
        ).resolves.toBe(
          "Invalid preview secret."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a missing bearer token",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              secret: ""
            })
          );

        expect(
          response.status
        ).toBe(401);

        await expect(
          response.text()
        ).resolves.toBe(
          "Invalid preview secret."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects malformed JSON",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              body: "{invalid-json"
            })
          );

        expect(
          response.status
        ).toBe(400);

        await expect(
          response.text()
        ).resolves.toBe(
          "A valid JSON request body is required."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a missing preview path",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              body: JSON.stringify({})
            })
          );

        expect(
          response.status
        ).toBe(400);

        await expect(
          response.text()
        ).resolves.toBe(
          "A valid preview path is required."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects an external URL",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              path:
                "https://evil.example.com"
            })
          );

        expect(
          response.status
        ).toBe(400);

        await expect(
          response.text()
        ).resolves.toBe(
          "A valid preview path is required."
        );

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a protocol-relative URL",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              path:
                "//evil.example.com"
            })
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "rejects a backslash-based external URL",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              path:
                "/\\evil.example.com"
            })
          );

        expect(
          response.status
        ).toBe(400);

        expect(
          mocks.enable
        ).not.toHaveBeenCalled();

        expect(
          mocks.redirect
        ).not.toHaveBeenCalled();
      }
    );

    it(
      "enables draft mode and redirects to a valid path",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        await expect(
          handler(
            createPreviewRequest({
              path: "/about-us"
            })
          )
        ).rejects.toThrow(
          "REDIRECT:/about-us"
        );

        expect(
          mocks.enable
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.redirect
        ).toHaveBeenCalledWith(
          "/about-us"
        );
      }
    );

    it(
      "preserves a query string in the preview path",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        await expect(
          handler(
            createPreviewRequest({
              path:
                "/about-us?foo=bar"
            })
          )
        ).rejects.toThrow(
          "REDIRECT:/about-us?foo=bar"
        );

        expect(
          mocks.enable
        ).toHaveBeenCalledTimes(1);

        expect(
          mocks.redirect
        ).toHaveBeenCalledWith(
          "/about-us?foo=bar"
        );
      }
    );

    it(
      "marks error responses as non-cacheable",
      async () => {
        const handler =
          createPreviewHandler({
            secret: previewSecret
          });

        const response =
          await handler(
            createPreviewRequest({
              secret: "wrong-secret"
            })
          );

        expect(
          response.headers.get(
            "Cache-Control"
          )
        ).toBe("no-store");
      }
    );
  }
);
