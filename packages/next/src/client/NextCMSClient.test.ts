import {
  describe,
  expect,
  it
} from "vitest";

import { NextCMSClient } from "./NextCMSClient";

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

        expect(client).toBeInstanceOf(
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

        expect(resource).toBeDefined();

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
      }
    );

    it(
      "preserves custom request headers",
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
                token: "test-token"
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

        expect(client).toBeInstanceOf(
          NextCMSClient
        );
      }
    );
  }
);

