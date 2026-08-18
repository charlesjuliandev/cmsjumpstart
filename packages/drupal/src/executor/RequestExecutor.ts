import type { DrupalResponse } from "../types";
import type { AuthProvider } from "../auth/AuthProvider";
import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiLink
} from "../types/DrupalResponse";

export interface RequestExecutorOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthProvider;
}

export class RequestExecutor {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(options: RequestExecutorOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");

    this.headers = {
      Accept: "application/vnd.api+json",
      ...options.headers,
      ...(options.auth?.getHeaders() ?? {})
    };
  }

  getHeaders(): Record<string, string> {
    return { ...this.headers };
  }

  async get<
    TAttributes = Record<string, unknown>,
    TRelationships = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes = Record<string, unknown>
  >(
    path: string,
    params?: URLSearchParams
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >
  > {
    const url = this.buildUrl(path, params);

    const response = await fetch(url, {
      method: "GET",
      headers: this.headers
    });

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`
      );
    }

    return response.json() as Promise<
      DrupalResponse<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >
    >;
  }

  async getNext<
    TAttributes = Record<string, unknown>,
    TRelationships = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes = Record<string, unknown>
  >(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    return this.getPage<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(response.links?.next);
  }

  async getPrevious<
    TAttributes = Record<string, unknown>,
    TRelationships = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes = Record<string, unknown>
  >(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    return this.getPage<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(response.links?.prev);
  }

  private async getPage<
    TAttributes = Record<string, unknown>,
    TRelationships = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes = Record<string, unknown>
  >(
    link?: DrupalJsonApiLink | string | null
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    if (!link) {
      return null;
    }

    const href =
      typeof link === "string"
        ? link
        : link.href;

    return this.get<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(href);
  }

  private buildUrl(
    path: string,
    params?: URLSearchParams
  ): URL {
    const url = new URL(
      path,
      `${this.baseUrl}/`
    );

    if (params) {
      url.search = params.toString();
    }

    return url;
  }
}