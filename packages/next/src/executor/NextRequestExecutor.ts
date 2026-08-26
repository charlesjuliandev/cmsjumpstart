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

    if (
      this.nextRequest.revalidate !==
      undefined
    ) {
      requestInit.next = {
        ...(requestInit.next ?? {}),

        revalidate:
          this.nextRequest.revalidate
      };
    }

    if (
      this.nextRequest.tags !==
      undefined
    ) {
      requestInit.next = {
        ...(requestInit.next ?? {}),

        tags:
          this.nextRequest.tags
      };
    }

    return requestInit;
  }
}
