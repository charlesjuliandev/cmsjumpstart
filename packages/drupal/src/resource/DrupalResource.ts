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
  DrupalJsonApiResource,
  DrupalResponse
} from "../types/DrupalResponse";

import {
  DrupalResourceResponse
} from "../response/DrupalResourceResponse";

export class DrupalResource<
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
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
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

    const response =
      await this.executor.get<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >(
        `/jsonapi/${this.getEndpoint()}`,
        params
      );

    return new DrupalResourceResponse(
      response
    );
  }

  async next(
    response:
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
      | DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
  ): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResource requires a RequestExecutor to execute requests."
      );
    }

    const rawResponse =
      response instanceof DrupalResourceResponse
        ? response.toJSON()
        : response;

    const nextResponse =
      await this.executor.getNext<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >(rawResponse);

    if (!nextResponse) {
      return null;
    }

    return new DrupalResourceResponse(
      nextResponse
    );
  }

  async previous(
    response:
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
      | DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
  ): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResource requires a RequestExecutor to execute requests."
      );
    }

    const rawResponse =
      response instanceof DrupalResourceResponse
        ? response.toJSON()
        : response;

    const previousResponse =
      await this.executor.getPrevious<
        TAttributes,
        TRelationships,
        TIncludedAttributes
      >(rawResponse);

    if (!previousResponse) {
      return null;
    }

    return new DrupalResourceResponse(
      previousResponse
    );
  }

  /**
   * Returns the raw relationship data.
   *
   * This is the low-level relationship helper and does not
   * resolve the relationship against included resources.
   *
   * Supports both:
   *
   * relationshipData(relationship)
   *
   * and:
   *
   * relationshipData(response, relationship)
   *
   * The one-argument form is useful when the relationship
   * object has already been obtained from a resource.
   */
  relationshipData(
    relationship:
      | DrupalJsonApiRelationship
      | undefined
  ):
    | DrupalJsonApiRelationship["data"]
    | null;

  relationshipData(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    relationship:
      | DrupalJsonApiRelationship
      | undefined
  ):
    | DrupalJsonApiRelationship["data"]
    | null;

  relationshipData(
    responseOrRelationship:
      | DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
      | DrupalJsonApiRelationship
      | undefined,
    relationship?: DrupalJsonApiRelationship
  ):
    | DrupalJsonApiRelationship["data"]
    | null {
    const relationshipData =
      relationship !== undefined
        ? relationship.data
        : (
            responseOrRelationship as
              | DrupalJsonApiRelationship
              | undefined
          )?.data;

    if (relationshipData === undefined) {
      return null;
    }

    return relationshipData;
  }

  /**
   * Resolves a single JSON:API relationship against
   * the response's included resources.
   *
   * Returns null when:
   * - the relationship is missing
   * - the relationship contains no data
   * - the relationship is to-many
   * - the related resource was not included
   */
  getIncludedResource(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    relationship:
      | DrupalJsonApiRelationship
      | undefined
  ): DrupalJsonApiResource<
    TIncludedAttributes
  > | null {
    if (
      !relationship?.data ||
      Array.isArray(relationship.data)
    ) {
      return null;
    }

    const identifier =
      relationship.data;

    return (
      response.included?.find(
        resource =>
          resource.type === identifier.type &&
          resource.id === identifier.id
      ) ?? null
    );
  }

  /**
   * Resolves a multi-value JSON:API relationship against
   * the response's included resources.
   *
   * Returns an empty array when:
   * - the relationship is missing
   * - the relationship contains no data
   * - the relationship is to-one
   * - matching resources were not included
   */
  getIncludedResources(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    relationship:
      | DrupalJsonApiRelationship
      | undefined
  ): DrupalJsonApiResource<
    TIncludedAttributes
  >[] {
    if (
      !relationship?.data ||
      !Array.isArray(relationship.data)
    ) {
      return [];
    }

    const identifiers =
      relationship.data;

    return (
      response.included?.filter(
        resource =>
          identifiers.some(
            identifier =>
              resource.type === identifier.type &&
              resource.id === identifier.id
          )
      ) ?? []
    );
  }

  /**
   * Resolves a typed to-one relationship by name
   * from the first resource in the response.
   */
  includedResource<
    TRelationship extends keyof TRelationships
  >(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    relationship: TRelationship
  ): DrupalJsonApiResource<
    TIncludedAttributes
  > | null {
    const relationshipValue =
      response.data?.[0]
        ?.relationships?.[
          relationship
        ];

    return this.getIncludedResource(
      response,
      relationshipValue
    );
  }

  /**
   * Resolves a typed to-many relationship by name
   * from the first resource in the response.
   */
  includedResources<
    TRelationship extends keyof TRelationships
  >(
    response: DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >,
    relationship: TRelationship
  ): DrupalJsonApiResource<
    TIncludedAttributes
  >[] {
    const relationshipValue =
      response.data?.[0]
        ?.relationships?.[
          relationship
        ];

    return this.getIncludedResources(
      response,
      relationshipValue
    );
  }

  private getEndpoint() {
    return this.resourceType.replace(
      "--",
      "/"
    );
  }
}