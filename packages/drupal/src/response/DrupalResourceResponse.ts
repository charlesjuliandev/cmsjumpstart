import type {
  DrupalJsonApiRelationship,
  DrupalResponse
} from "../types/DrupalResponse";

import type {
  RequestExecutor
} from "../executor/RequestExecutor";

import {
  DrupalResourceItem
} from "../resource/DrupalResourceItem";

export class DrupalResourceResponse<
  TAttributes extends Record<string, unknown> = Record<
    string,
    unknown
  >,
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
> {
  constructor(
    private readonly response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    private readonly executor?: RequestExecutor
  ) {}

  get jsonapi() {
    return this.response.jsonapi;
  }

  get links() {
    return this.response.links;
  }

  get meta() {
    return this.response.meta;
  }

  get included() {
    return this.response.included;
  }

  get data() {
    return this.response.data;
  }

  get length(): number {
    return this.response.data.length;
  }

  getOne(
    index = 0
  ): DrupalResourceItem<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null {
    const resource =
      this.response.data[index];

    if (!resource) {
      return null;
    }

    return new DrupalResourceItem<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(
      resource,
      this.response.included
    );
  }

  getAll(): DrupalResourceItem<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  >[] {
    return this.response.data.map(
      resource =>
        new DrupalResourceItem<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >(
          resource,
          this.response.included
        )
    );
  }

  /**
   * Fetches the next page of results.
   *
   * Returns null when the current response does not
   * contain a next-page link.
   *
   * Pagination preserves all response generics.
   */
  async next(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResourceResponse requires a RequestExecutor to paginate."
      );
    }

    const response =
      await this.executor.getNext<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >(this.response);

    if (!response) {
      return null;
    }

    return new DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(
      response,
      this.executor
    );
  }

  /**
   * Fetches the previous page of results.
   *
   * Returns null when the current response does not
   * contain a previous-page link.
   *
   * Pagination preserves all response generics.
   */
  async previous(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResourceResponse requires a RequestExecutor to paginate."
      );
    }

    const response =
      await this.executor.getPrevious<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >(this.response);

    if (!response) {
      return null;
    }

    return new DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(
      response,
      this.executor
    );
  }

  toJSON(): DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > {
    return this.response;
  }
}