import { describe, expect, it } from "vitest";
import {
  createDrupalClient
} from "./index";

describe("createDrupalClient", () => {
  it("creates a DrupalClient", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com"
    });

    expect(client).toBeDefined();

    expect(
      client.resource("node--page")
        .getQuery()
        .getResourceType()
    ).toBe("node--page");
  });

  it("supports the apiKey shorthand", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      apiKey: "secret-api-key"
    });

    const resource = client.resource("node--page");

    expect(resource).toBeDefined();
  });

  it("supports bearer authentication", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      auth: {
        type: "bearer",
        token: "secret-token"
      }
    });

    expect(client).toBeDefined();
  });

  it("supports basic authentication", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      auth: {
        type: "basic",
        username: "username",
        password: "password"
      }
    });

    expect(client).toBeDefined();
  });

  it("supports api-key authentication with a custom header", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      auth: {
        type: "api-key",
        key: "secret-api-key",
        header: "X-API-Key"
      }
    });

    expect(client).toBeDefined();
  });

  it("supports explicitly disabling authentication", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      auth: {
        type: "none"
      }
    });

    expect(client).toBeDefined();
  });

  it("prefers explicit auth over the apiKey shorthand", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      apiKey: "shorthand-key",
      auth: {
        type: "bearer",
        token: "explicit-token"
      }
    });

    expect(client).toBeDefined();
  });

  it("preserves custom headers", () => {
    const client = createDrupalClient({
      baseUrl: "https://example.com",
      headers: {
        "X-Consumer-ID": "consumer-id"
      }
    });

    expect(client).toBeDefined();
  });
});