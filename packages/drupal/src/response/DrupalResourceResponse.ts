import type {
  DrupalJsonApiRelationship,
  DrupalRelationshipDefinitions,
  DrupalResponse
} from "../types/DrupalResponse";

import type {
  RequestExecutor
} from "../executor/RequestExecutor";

import {
  DrupalResourceItem
} from "../resource/DrupalResourceItem";

export class DrupalResourceResponse<
  TAttributes extends Record<string, unknown> =
    Record<string, unknown>,

  TRelationships extends Record<
    string,
    DrupalJsonApiRelationship
  > =
    Record<
      string,
      DrupalJsonApiRelationship
    >,

  TIncludedAttributes extends Record<
    string,
    unknown
  > =
    Record<string, unknown>,

  TRelationshipDefinitions extends
    DrupalRelationshipDefinitions =
      Record<string, never>
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

  /**
   * Returns a single resource item by index.
   *
   * The relationship definition map is preserved so
   * typed relationship resolution continues through
   * DrupalResourceItem.
   */
  getOne(
    index = 0
  ): DrupalResourceItem<
    TAttributes,
    TRelationships,
    TIncludedAttributes,
    TRelationshipDefinitions
  > | null {
    const resource =
      this.response.data[index];

    if (!resource) {
      return null;
    }

    return new DrupalResourceItem<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >(
      resource,
      this.response.included
    );
  }

  /**
   * Returns all resource items.
   *
   * The relationship definition map is preserved for
   * every returned DrupalResourceItem.
   */
  getAll(): DrupalResourceItem<
    TAttributes,
    TRelationships,
    TIncludedAttributes,
    TRelationshipDefinitions
  >[] {
    return this.response.data.map(
      resource =>
        new DrupalResourceItem<
          TAttributes,
          TRelationships,
          TIncludedAttributes,
          TRelationshipDefinitions
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
   * Pagination preserves all response generics,
   * including the relationship definition map.
   */
  async next(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
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
      TIncludedAttributes,
      TRelationshipDefinitions
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
   * Pagination preserves all response generics,
   * including the relationship definition map.
   */
  async previous(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
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
      TIncludedAttributes,
      TRelationshipDefinitions
    >(
      response,
      this.executor
    );
  }

  /**
   * Returns the underlying raw JSON:API response.
   *
   * This provides an escape hatch when developers need
   * the complete Drupal JSON:API representation.
   */
  toJSON(): DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > {
    return this.response;
  }
}