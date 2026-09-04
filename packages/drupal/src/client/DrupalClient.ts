import type { DrupalClientConfig } from "../types/DrupalClientConfig";
import { DrupalResource } from "../resource/DrupalResource";
import { RequestExecutor } from "../executor/RequestExecutor";
import type {
  DrupalJsonApiRelationship,
  DrupalRelationshipDefinitions,
} from "../types/DrupalResponse";
import { encodeBase64 } from "../utils/base64";
export class DrupalClient {
  private readonly executor: RequestExecutor;
  constructor(
    private readonly config: DrupalClientConfig,
    executor?: RequestExecutor,
  ) {
    if (executor) {
      this.executor = executor;
      return;
    }
    const executorOptions = {
      baseUrl: config.baseUrl,
      headers: this.getHeaders(),
    };
    if (config.request !== undefined) {
      Object.assign(executorOptions, { request: config.request });
    }
    this.executor = new RequestExecutor(executorOptions);
  }
  resource<
    TAttributes extends Record<string, unknown> = Record<string, unknown>,
    TRelationships extends Record<string, DrupalJsonApiRelationship> = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes extends Record<string, unknown> = Record<
      string,
      unknown
    >,
    TRelationshipDefinitions extends DrupalRelationshipDefinitions = Record<
      string,
      never
    >,
  >(resourceType: string, executor?: RequestExecutor) {
    return new DrupalResource<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >(resourceType, executor ?? this.executor);
  }
  getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/vnd.api+json",
      ...this.config.headers,
      ...this.config.request?.headers,
    };
    if (!this.config.auth) {
      return headers;
    }
    switch (this.config.auth.type) {
      case "api-key":
        headers[this.config.auth.header ?? "Authorization"] =
          this.config.auth.key;
        break;
      case "bearer":
        headers.Authorization = `Bearer ${this.config.auth.token}`;
        break;
      case "basic":
        headers.Authorization = `Basic ${encodeBase64(`${this.config.auth.username}:${this.config.auth.password}`)}`;
        break;
      case "none":
        break;
    }
    return headers;
  }
}
