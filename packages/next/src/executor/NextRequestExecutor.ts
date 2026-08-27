import {
  RequestExecutor
} from "@cmsjumpstart/drupal";

import type {
  RequestExecutorOptions,
  RequestOptions
} from "@cmsjumpstart/drupal";

interface NextFetchRequestInit
  extends RequestInit {
  next?: {
    revalidate?:
      | number
      | false;

    tags?: string[];
  };
}

export interface NextRequestOptions
  extends RequestOptions {
  revalidate?:
    | number
    | false;

  tags?: string[];
}

export interface NextRequestExecutorOptions
  extends Omit<
    RequestExecutorOptions,
    "request"
  > {
  request?: NextRequestOptions;
}

export class NextRequestExecutor
  extends RequestExecutor {
  private readonly nextRequest:
    NextRequestOptions;

  constructor(
    options: NextRequestExecutorOptions
  ) {
    if (
      options.request !== undefined
    ) {
      super({
        ...options,
        request:
          options.request
      });
    } else {
      super(options);
    }

    this.nextRequest =
      options.request ?? {};
  }

  protected override createRequestInit(
    signal: AbortSignal
  ): RequestInit {
    const requestInit =
      super.createRequestInit(
        signal
      ) as NextFetchRequestInit;

    const next: NonNullable<
      NextFetchRequestInit["next"]
    > = {};

    if (
      this.nextRequest.revalidate !==
      undefined
    ) {
      next.revalidate =
        this.nextRequest.revalidate;
    }

    if (
      this.nextRequest.tags !==
      undefined
    ) {
      next.tags =
        this.nextRequest.tags;
    }

    if (
      Object.keys(next).length > 0
    ) {
      requestInit.next = next;
    }

    return requestInit;
  }
}

