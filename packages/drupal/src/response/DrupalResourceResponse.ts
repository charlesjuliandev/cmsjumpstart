import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiResource,
  DrupalResponse
} from "../types/DrupalResponse";

import {
  DrupalResourceItem
} from "./DrupalResourceItem";

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
    >
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

  toJSON(): DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > {
    return this.response;
  }
}