import { DrupalResourceResponse } from "@cmsjumpstart/drupal";
import type {
  DrupalFilterOperator,
  DrupalFilterValue,
  DrupalJsonApiRelationship,
  DrupalJsonApiResource,
  DrupalRelationshipDefinitions,
  DrupalResponse,
  DrupalResource,
  DrupalQueryBuilder,
} from "@cmsjumpstart/drupal";
import { NextRequestExecutor } from "../executor/NextRequestExecutor";
export class NextCMSResource<
  TAttributes extends Record<string, unknown> = Record<string, unknown>,
  TRelationships extends Record<string, DrupalJsonApiRelationship> = Record<
    string,
    DrupalJsonApiRelationship
  >,
  TIncludedAttributes extends Record<string, unknown> = Record<string, unknown>,
  TRelationshipDefinitions extends DrupalRelationshipDefinitions = Record<
    string,
    never
  >,
> {
  constructor(
    private readonly resource: DrupalResource<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >,
    private readonly executor?: NextRequestExecutor,
  ) {}
  include(...fields: string[]): this {
    this.resource.include(...fields);
    return this;
  }
  fields(...fields: string[]): this {
    this.resource.fields(...fields);
    return this;
  }
  /** * Enables the Next.js HTTP/data cache * for this resource request. * * Example: * * .cache() * .get() */ cache(): this {
    this.executor?.enableCache();
    return this;
  }
  /** * Equality filter. * * Example: * * .filter("status", true) */ filter(
    field: string,
    value: DrupalFilterValue,
  ): this;
  /** * Comparison, string, collection, * or range filter. * * Example: * * .filter( * "title", * "CONTAINS", * "Drupal" * ) */ filter(
    field: string,
    operator: Exclude<DrupalFilterOperator, "IS NULL" | "IS NOT NULL">,
    value: DrupalFilterValue,
  ): this;
  /** * NULL filter. * * Example: * * .filter( * "field_image", * "IS NULL" * ) */ filter(
    field: string,
    operator: "IS NULL" | "IS NOT NULL",
  ): this;
  filter(
    field: string,
    operatorOrValue: DrupalFilterOperator | DrupalFilterValue,
    value?: DrupalFilterValue,
  ): this {
    if (value === undefined) {
      this.resource.filter(
        field,
        operatorOrValue as DrupalFilterOperator | DrupalFilterValue,
      );
      return this;
    }
    this.resource.filter(
      field,
      operatorOrValue as Exclude<
        DrupalFilterOperator,
        "IS NULL" | "IS NOT NULL"
      >,
      value,
    );
    return this;
  }
  sort(...fields: string[]): this {
    this.resource.sort(...fields);
    return this;
  }
  page(number: number): this {
    this.resource.page(number);
    return this;
  }
  limit(number: number): this {
    this.resource.limit(number);
    return this;
  }
  getQuery(): DrupalQueryBuilder {
    return this.resource.getQuery();
  }
  async get(): Promise<
    DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >
  > {
    return this.resource.get();
  }
  async next(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null>;
  async next(
    response: DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null>;
  async next(
    response:
      | DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes,
          TRelationshipDefinitions
        >,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null> {
    const rawResponse =
      response instanceof DrupalResourceResponse ? response.toJSON() : response;
    return this.resource.next(rawResponse);
  }
  async previous(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null>;
  async previous(
    response: DrupalResourceResponse<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null>;
  async previous(
    response:
      | DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>
      | DrupalResourceResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes,
          TRelationshipDefinitions
        >,
  ): Promise<DrupalResponse<
    TAttributes,
    TRelationships,
    TIncludedAttributes
  > | null> {
    const rawResponse =
      response instanceof DrupalResourceResponse ? response.toJSON() : response;
    return this.resource.previous(rawResponse);
  }
  relationshipData(
    relationship: DrupalJsonApiRelationship | undefined,
  ): DrupalJsonApiRelationship["data"] | null;
  relationshipData(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
    relationship: DrupalJsonApiRelationship | undefined,
  ): DrupalJsonApiRelationship["data"] | null;
  relationshipData(
    responseOrRelationship:
      | DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>
      | DrupalJsonApiRelationship
      | undefined,
    relationship?: DrupalJsonApiRelationship | undefined,
  ): DrupalJsonApiRelationship["data"] | null {
    if (relationship !== undefined) {
      return this.resource.relationshipData(
        responseOrRelationship as DrupalResponse<
          TAttributes,
          TRelationships,
          TIncludedAttributes
        >,
        relationship,
      );
    }
    return this.resource.relationshipData(
      responseOrRelationship as DrupalJsonApiRelationship | undefined,
    );
  }
  getIncludedResource(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
    relationship: DrupalJsonApiRelationship | undefined,
  ): DrupalJsonApiResource<TIncludedAttributes> | null {
    return this.resource.getIncludedResource(response, relationship);
  }
  getIncludedResources(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
    relationship: DrupalJsonApiRelationship | undefined,
  ): DrupalJsonApiResource<TIncludedAttributes>[] {
    return this.resource.getIncludedResources(response, relationship);
  }
  includedResource<TRelationship extends keyof TRelationships>(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
    relationship: TRelationship,
  ): DrupalJsonApiResource<TIncludedAttributes> | null {
    return this.resource.includedResource(response, relationship);
  }
  includedResources<TRelationship extends keyof TRelationships>(
    response: DrupalResponse<TAttributes, TRelationships, TIncludedAttributes>,
    relationship: TRelationship,
  ): DrupalJsonApiResource<TIncludedAttributes>[] {
    return this.resource.includedResources(response, relationship);
  }
}
