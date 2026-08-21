import type { DrupalResponse } from "../types";

import type { AuthProvider } from "../auth/AuthProvider";

import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiLink
} from "../types/DrupalResponse";

export interface RequestOptions {
  headers?: Record<string, string>;
  cache?: RequestCache;
}

export interface RequestExecutorOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthProvider;
  timeout?: number;
  request?: RequestOptions;
}

export class RequestExecutor {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;
  private readonly timeout: number;
  private readonly request: RequestOptions;

  constructor(
    options: RequestExecutorOptions
  ) {
    this.baseUrl =
      options.baseUrl.replace(/\/$/, "");

    this.headers = {
      Accept: "application/vnd.api+json",
      ...options.headers,
      ...(options.auth?.getHeaders() ?? {})
    };

    this.timeout =
      options.timeout ?? 15000;

    this.request =
      options.request ?? {};
  }

  getHeaders(): Record<string, string> {
    return {
      ...this.headers
    };
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
    const url =
      this.buildUrl(
        path,
        params
      );

    const controller =
      new AbortController();

    const timeoutId =
      setTimeout(
        () =>
          controller.abort(),
        this.timeout
      );

    try {
      const requestInit: RequestInit = {
        method: "GET",
        headers: {
          ...this.request.headers,
          ...this.headers
        },
        signal:
          controller.signal
      };

      if (
        this.request.cache !== undefined
      ) {
        requestInit.cache =
          this.request.cache;
      }

      const response =
        await fetch(
          url,
          requestInit
        );

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
    } catch (error) {
      if (
        error instanceof Error &&
        error.name === "AbortError"
      ) {
        throw new Error(
          `Request timed out after ${this.timeout}ms: ${url}`
        );
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
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
    >(
      response.links?.next
    );
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
    >(
      response.links?.prev
    );
  }

  private async getPage<
    TAttributes = Record<string, unknown>,
    TRelationships = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes = Record<string, unknown>
  >(
    link?:
      | DrupalJsonApiLink
      | string
      | null
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
    const url =
      new URL(
        path,
        `${this.baseUrl}/`
      );

    if (params) {
      url.search =
        params.toString();
    }

    return url;
  }
}