import { describe, expect, it, vi } from "vitest";
import { DrupalClient } from "./DrupalClient";
import { RequestExecutor } from "../executor/RequestExecutor";

describe("DrupalClient", () => {
  it("creates a Drupal resource", () => {
    const client = new DrupalClient({
      baseUrl: "https://example.com"
    });

    const resource =
      client.resource("node--page");

    expect(
      resource.getQuery().getResourceType()
    ).toBe("node--page");
  });

  it("uses an injected request executor", async () => {
    const response = {
      data: []
    };

    const executor = {
      get: vi.fn().mockResolvedValue(response)
    };

    const client = new DrupalClient(
      {
        baseUrl: "https://example.com"
      },
      executor as unknown as RequestExecutor
    );

    const result = await client
      .resource("node--page")
      .limit(10)
      .get();

    expect(executor.get)
      .toHaveBeenCalledTimes(1);

    expect(result)
      .toEqual(response);
  });
});