import {
  DrupalQueryBuilder
} from "../query/DrupalQueryBuilder";

import {
  DrupalQuerySerializer
} from "../query/DrupalQuerySerializer";

import type {
  DrupalFilterOperator,
  DrupalFilterValue
} from "../query/types";

import {
  RequestExecutor
} from "../executor/RequestExecutor";

import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiResource,
  DrupalRelationshipDefinitions,
  DrupalResponse
} from "../types/DrupalResponse";

import {
  DrupalResourceResponse
} from "../response/DrupalResourceResponse";

export class DrupalResource<
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
  private query: DrupalQueryBuilder;

  constructor(
    private readonly resourceType: string,
    private readonly executor?: RequestExecutor
  ) {
    this.query =
      DrupalQueryBuilder.create(
        resourceType
      );
  }

  include(
    ...fields: string[]
  ): this {
    this.query =
      this.query.include(...fields);

    return this;
  }

  fields(
    ...fields: string[]
  ): this {
    this.query =
      this.query.fields(...fields);

    return this;
  }

  /**
   * Equality filter.
   *
   * Example:
   *
   * .filter("status", true)
   */
  filter(
    field: string,
    value: DrupalFilterValue
  ): this;

  /**
   * Comparison, string, collection,
   * or range filter.
   *
   * Example:
   *
   * .filter(
   *   "title",
   *   "CONTAINS",
   *   "Drupal"
   * )
   */
  filter(
    field: string,
    operator: Exclude<
      DrupalFilterOperator,
      "IS NULL" | "IS NOT NULL"
    >,
    value: DrupalFilterValue
  ): this;

  /**
   * NULL filter.
   *
   * Example:
   *
   * .filter(
   *   "field_image",
   *   "IS NULL"
   * )
   */
  filter(
    field: string,
    operator:
      | "IS NULL"
      | "IS NOT NULL"
  ): this;

  filter(
    field: string,
    operatorOrValue:
      | DrupalFilterOperator
      | DrupalFilterValue,
    value?: DrupalFilterValue
  ): this {
    if (value === undefined) {
      this.query =
        this.query.filter(
          field,
          operatorOrValue as
            | DrupalFilterOperator
            | DrupalFilterValue
        );

      return this;
    }

    this.query =
      this.query.filter(
        field,
        operatorOrValue as Exclude<
          DrupalFilterOperator,
          "IS NULL" | "IS NOT NULL"
        >,
        value
      );

    return this;
  }

  sort(
    ...fields: string[]
  ): this {
    this.query =
      this.query.sort(...fields);

    return this;
  }

  page(
    number: number
  ): this {
    this.query =
      this.query.page(number);

    return this;
  }

  limit(
    number: number
  ): this {
    this.query =
      this.query.limit(number);

    return this;
  }

  getQuery(): DrupalQueryBuilder {
    return this.query;
  }

  async get(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
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
   * Low-level pagination helper.
   *
   * Accepts either a raw DrupalResponse or a
   * DrupalResourceResponse.
   *
   * Prefer response.next() for the convenient
   * response-oriented API.
   *
   * The relationship definition map is preserved
   * by the resource's generic type even though the
   * low-level executor operates on the raw response.
   */
  async next(
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
  >;

  async next(
    response: DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  >;

  async next(
    response:
      | DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes,
          TRelationshipDefinitions
        >
  ): Promise<
    DrupalResponse<
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

    return this.executor.getNext<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(rawResponse);
  }

  /**
   * Low-level pagination helper.
   *
   * Accepts either a raw DrupalResponse or a
   * DrupalResourceResponse.
   *
   * Prefer response.previous() for the convenient
   * response-oriented API.
   */
  async previous(
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
  >;

  async previous(
    response: DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >
  ): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    > | null
  >;

  async previous(
    response:
      | DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes,
          TRelationshipDefinitions
        >
  ): Promise<
    DrupalResponse<
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

    return this.executor.getPrevious<
      TAttributes,
      TRelationships,
      TIncludedAttributes
    >(rawResponse);
  }

  /**
   * Returns the raw relationship data.
   *
   * Supports:
   *
   * relationshipData(relationship)
   *
   * and:
   *
   * relationshipData(response, relationship)
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

    relationship?:
      | DrupalJsonApiRelationship
      | undefined
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

    if (
      relationshipData === undefined
    ) {
      return null;
    }

    return relationshipData;
  }

  /**
   * Resolves a single JSON:API relationship
   * against the response's included resources.
   *
   * This is the low-level/raw resource helper.
   * Typed relationship mapping is provided by
   * DrupalResourceItem.
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
      Array.isArray(
        relationship.data
      )
    ) {
      return null;
    }

    const identifier =
      relationship.data;

    return (
      response.included?.find(
        resource =>
          resource.type ===
            identifier.type &&
          resource.id ===
            identifier.id
      ) ?? null
    );
  }

  /**
   * Resolves a multi-value JSON:API
   * relationship against included resources.
   *
   * This is the low-level/raw resource helper.
   * Typed relationship mapping is provided by
   * DrupalResourceItem.
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
      !Array.isArray(
        relationship.data
      )
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
              resource.type ===
                identifier.type &&
              resource.id ===
                identifier.id
          )
      ) ?? []
    );
  }

  /**
   * Resolves a typed to-one relationship
   * by name from the first resource.
   *
   * This remains a low-level raw-resource API.
   * For the higher-level typed API, use:
   *
   * response.getOne()?.includedResource(...)
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
   * Resolves a typed to-many relationship
   * by name from the first resource.
   *
   * This remains a low-level raw-resource API.
   * For the higher-level typed API, use:
   *
   * response.getOne()?.includedResources(...)
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

  private getEndpoint(): string {
    return this.resourceType.replace(
      "--",
      "/"
    );
  }
}