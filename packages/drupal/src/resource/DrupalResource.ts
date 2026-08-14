import {
  DrupalQueryBuilder
} from "../query/DrupalQueryBuilder";

import {
  DrupalQuerySerializer
} from "../query/DrupalQuerySerializer";

import type {
  DrupalFilterOperator
} from "../query/types";

import {
  RequestExecutor
} from "../executor/RequestExecutor";

import type {
  DrupalJsonApiRelationship,
  DrupalResponse
} from "../types/DrupalResponse";

export class DrupalResource<
  TAttributes = Record<string, unknown>,
  TRelationships = Record<
    string,
    DrupalJsonApiRelationship
  >
> {
  private query: DrupalQueryBuilder;

  constructor(
    private readonly resourceType: string,
    private readonly executor?: RequestExecutor
  ) {
    this.query =
      DrupalQueryBuilder.create(resourceType);
  }

  include(...fields: string[]) {
    this.query =
      this.query.include(...fields);

    return this;
  }

  fields(...fields: string[]) {
    this.query =
      this.query.fields(...fields);

    return this;
  }

  filter(
    field: string,
    value: string | number | boolean
  ): this;

  filter(
    field: string,
    operator: DrupalFilterOperator,
    value: string | number | boolean
  ): this;

  filter(
    field: string,
    operatorOrValue:
      | DrupalFilterOperator
      | string
      | number
      | boolean,
    value?: string | number | boolean
  ): this {
    this.query =
      value === undefined
        ? this.query.filter(
            field,
            operatorOrValue as
              | string
              | number
              | boolean
          )
        : this.query.filter(
            field,
            operatorOrValue as DrupalFilterOperator,
            value
          );

    return this;
  }

  sort(...fields: string[]) {
    this.query =
      this.query.sort(...fields);

    return this;
  }

  page(number: number) {
    this.query =
      this.query.page(number);

    return this;
  }

  limit(number: number) {
    this.query =
      this.query.limit(number);

    return this;
  }

  getQuery() {
    return this.query;
  }

  async get(): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships
    >
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResource requires a RequestExecutor to execute requests."
      );
    }

    const params =
      DrupalQuerySerializer.serialize(
        this.query
      );

    return this.executor.get<
      TAttributes,
      TRelationships
    >(
      `/jsonapi/${this.getEndpoint()}`,
      params
    );
  }

  private getEndpoint() {
    return this.resourceType.replace(
      "--",
      "/"
    );
  }
}