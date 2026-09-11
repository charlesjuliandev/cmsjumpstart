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
      "rejects an invalid secret",
      async () => {
        const handler =
          createPreviewHandler({
            secret:
              "correct-secret"
          });

        const response =
          await handler(
            new Request(
              "https://example.com/preview?secret=wrong&path=/"
            )
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
      "rejects a missing secret",
      async () => {
        const handler =
          createPreviewHandler({
            secret:
              "correct-secret"
          });

        const response =
          await handler(
            new Request(
              "https://example.com/preview?path=/"
            )
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
      "rejects a missing path",
      async () => {
        const handler =
          createPreviewHandler({
            secret:
              "correct-secret"
          });

        const response =
          await handler(
            new Request(
              "https://example.com/preview?secret=correct-secret"
            )
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
            secret:
              "correct-secret"
          });

        const response =
          await handler(
            new Request(
              "https://example.com/preview?secret=correct-secret&path=https%3A%2F%2Fevil.example.com"
            )
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
            secret:
              "correct-secret"
          });

        const response =
          await handler(
            new Request(
              "https://example.com/preview?secret=correct-secret&path=%2F%2Fevil.example.com"
            )
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
      "enables draft mode and redirects to a valid path",
      async () => {
        const handler =
          createPreviewHandler({
            secret:
              "correct-secret"
          });

        await expect(
          handler(
            new Request(
              "https://example.com/preview?secret=correct-secret&path=%2Fabout-us"
            )
          )
        ).rejects.toThrow(
          "REDIRECT:/about-us"
        );

        expect(
          mocks.enable
        ).toHaveBeenCalledTimes(
          1
        );

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
            secret:
              "correct-secret"
          });

        await expect(
          handler(
            new Request(
              "https://example.com/preview?secret=correct-secret&path=%2Fabout-us%3Ffoo%3Dbar"
            )
          )
        ).rejects.toThrow(
          "REDIRECT:/about-us?foo=bar"
        );

        expect(
          mocks.enable
        ).toHaveBeenCalledTimes(
          1
        );

        expect(
          mocks.redirect
        ).toHaveBeenCalledWith(
          "/about-us?foo=bar"
        );
      }
    );
  }
);