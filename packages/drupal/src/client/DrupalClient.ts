import type { DrupalClientConfig } from "../types/DrupalClientConfig";
import { DrupalResource } from "../resource/DrupalResource";
import { RequestExecutor } from "../executor/RequestExecutor";
import { encodeBase64 } from "../utils/base64";

import type {
  DrupalJsonApiRelationship
} from "../types/DrupalResponse";

export class DrupalClient {
  private readonly executor: RequestExecutor;

  constructor(
    private readonly config: DrupalClientConfig,
    executor?: RequestExecutor
  ) {
    this.executor =
      executor ??
      new RequestExecutor({
        baseUrl: config.baseUrl,
        headers: this.buildHeaders()
      });
  }

  resource<
    TAttributes extends Record<string, unknown> =
      Record<string, unknown>,
    TRelationships extends Record<
      string,
      DrupalJsonApiRelationship
    > = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes extends Record<
      string,
      unknown
    > = Record<string, unknown>
  >(
    resourceType: string
  ) {
    return new DrupalResource<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(
      resourceType,
      this.executor
    );
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.api+json",
      ...this.config.headers
    };

    if (!this.config.auth) {
      return headers;
    }

    switch (this.config.auth.type) {
      case "api-key":
        headers[
          this.config.auth.header ??
            "Authorization"
        ] = this.config.auth.key;
        break;

      case "bearer":
        headers.Authorization =
          `Bearer ${this.config.auth.token}`;
        break;

      case "basic":
        headers.Authorization =
          `Basic ${encodeBase64(
            `${this.config.auth.username}:${this.config.auth.password}`
          )}`;
        break;

      case "none":
        break;
    }

    return headers;
  }
}