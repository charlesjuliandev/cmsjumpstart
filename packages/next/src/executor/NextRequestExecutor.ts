import {
  RequestExecutor
} from "@cmsjumpstart/drupal";

import type {
  RequestExecutorOptions,
  RequestOptions
} from "@cmsjumpstart/drupal";

import {
  getResourceCacheTags
} from "../cache/cacheTags";

interface NextFetchRequestInit
  extends RequestInit {
  next?: {
    revalidate?: number | false;
    tags?: string[];
  };
}

export interface NextRequestOptions
  extends RequestOptions {
  revalidate?: number | false;
  tags?: string[];
}

export interface NextRequestExecutorOptions
  extends Omit<
    RequestExecutorOptions,
    "request"
  > {
  request?: NextRequestOptions;
  resourceType?: string;
}

export class NextRequestExecutor
  extends RequestExecutor {
  private readonly nextRequest:
    NextRequestOptions;

  private readonly resourceType?:
    string;

  constructor(
    options:
      NextRequestExecutorOptions
  ) {
    const request =
      options.request ?? {};

    super({
      ...options,
      request
    });

    this.nextRequest =
      request;

    if (
      options.resourceType !==
      undefined
    ) {
      this.resourceType =
        options.resourceType;
    }
  }

  /**
   * Enables Next.js-compatible
   * HTTP caching for requests made
   * by this executor.
   */
  enableCache(): void {
    this.request.cache =
      "force-cache";

    this.nextRequest.cache =
      "force-cache";
  }

  protected override createRequestInit(
    signal: AbortSignal
  ): RequestInit {
    const requestInit =
      super.createRequestInit(
        signal
      ) as NextFetchRequestInit;

    const next:
      NonNullable<
        NextFetchRequestInit["next"]
      > = {};

    if (
      this.nextRequest.revalidate !==
      undefined
    ) {
      next.revalidate =
        this.nextRequest.revalidate;
    }

    const applicationTags =
      this.nextRequest.tags ?? [];

    const resourceTags =
      this.resourceType !==
      undefined
        ? getResourceCacheTags(
            this.resourceType
          )
        : [];

    const tags = [
      ...resourceTags,
      ...applicationTags
    ];

    if (tags.length > 0) {
      next.tags = [
        ...new Set(tags)
      ];
    }

    if (
      Object.keys(next).length > 0
    ) {
      requestInit.next =
        next;
    }

    return requestInit;
  }
}

