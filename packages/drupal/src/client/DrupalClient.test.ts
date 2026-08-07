import { describe, expect, it, vi } from "vitest";
import { DrupalClient } from "./DrupalClient";
import { RequestExecutor } from "../executor/RequestExecutor";

describe("DrupalClient", () => {
  it("creates a Drupal resource", () => {
    const client =
      new DrupalClient({
        baseUrl: "https://example.com"
      });

    const resource =
      client.resource("node--page");

    expect(
      resource
        .getQuery()
        .getResourceType()
    ).toBe("node--page");
  });

  it("uses an injected request executor", async () => {
    const executor = {
      get: vi.fn()
        .mockResolvedValue({
          data: []
        })
    } as unknown as RequestExecutor;

    const client =
      new DrupalClient(
        {
          baseUrl: "https://example.com"
        },
        executor
      );

    const result =
      await client
        .resource("node--page")
        .limit(10)
        .get();

    expect(executor.get)
      .toHaveBeenCalledTimes(1);

    expect(result)
      .toEqual({
        data: []
      });
  });

  it("adds custom Drupal headers", () => {
    const executor =
      new RequestExecutor({
        baseUrl: "https://example.com",
        headers: {
          "X-Consumer-ID": "consumer-id",
          "api-key": "api-key-value"
        }
      });

    expect(
      executor.getHeaders()
    ).toEqual({
      Accept: "application/vnd.api+json",
      "X-Consumer-ID": "consumer-id",
      "api-key": "api-key-value"
    });
  });
});