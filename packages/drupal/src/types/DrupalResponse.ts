export interface DrupalJsonApiLink {
  href: string;
  meta?: Record<string, unknown>;
}

export interface DrupalJsonApiLinks {
  self?: DrupalJsonApiLink | string;
  next?: DrupalJsonApiLink | string | null;
  prev?: DrupalJsonApiLink | string | null;
  related?: DrupalJsonApiLink | string;
}

export interface DrupalJsonApiRelationshipIdentifier {
  type: string;
  id: string;
  meta?: Record<string, unknown>;
}

/**
 * A JSON:API to-one relationship.
 *
 * The relationship may contain a resource identifier
 * or null when the relationship is empty.
 */
export interface DrupalJsonApiToOneRelationship {
  data:
    | DrupalJsonApiRelationshipIdentifier
    | null;

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

/**
 * A JSON:API to-many relationship.
 *
 * The relationship contains zero or more resource
 * identifiers.
 */
export interface DrupalJsonApiToManyRelationship {
  data: DrupalJsonApiRelationshipIdentifier[];

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

/**
 * A general JSON:API relationship.
 *
 * Supports both to-one and to-many relationships,
 * as well as empty relationships.
 */
export interface DrupalJsonApiRelationship {
  data:
    | DrupalJsonApiRelationshipIdentifier
    | DrupalJsonApiRelationshipIdentifier[]
    | null;

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

/**
 * Describes the TypeScript shape of a relationship target.
 *
 * This is intentionally separate from DrupalJsonApiRelationship.
 *
 * DrupalJsonApiRelationship describes the raw JSON:API
 * response received from Drupal, while
 * DrupalRelationshipDefinition describes the resource
 * that the relationship points to.
 *
 * TAttributes describes the related resource's attributes.
 *
 * TRelationships describes the related resource's
 * relationships, allowing relationship typing to continue
 * through nested included resources.
 *
 * TCardinality determines whether the relationship is
 * to-one or to-many.
 */
export interface DrupalRelationshipDefinition<
  TAttributes extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TRelationships extends Record<
    string,
    unknown
  > = Record<
    string,
    unknown
  >,
  TCardinality extends "one" | "many" = "one"
> {
  attributes: TAttributes;

  relationships: TRelationships;

  cardinality: TCardinality;
}

/**
 * A convenience type for defining a to-one relationship.
 */
export type DrupalToOneRelationship<
  TAttributes extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TRelationships extends Record<
    string,
    unknown
  > = Record<
    string,
    unknown
  >
> = DrupalRelationshipDefinition<
  TAttributes,
  TRelationships,
  "one"
>;

/**
 * A convenience type for defining a to-many relationship.
 */
export type DrupalToManyRelationship<
  TAttributes extends Record<string, unknown> = Record<
    string,
    unknown
  >,
  TRelationships extends Record<
    string,
    unknown
  > = Record<
    string,
    unknown
  >
> = DrupalRelationshipDefinition<
  TAttributes,
  TRelationships,
  "many"
>;

export interface DrupalJsonApiResource<
  TAttributes = Record<string, unknown>,
  TRelationships = Record<
    string,
    DrupalJsonApiRelationship
  >
> {
  type: string;

  id: string;

  attributes: TAttributes;

  relationships?: TRelationships;

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

export interface DrupalResponse<
  TAttributes = Record<string, unknown>,
  TRelationships = Record<
    string,
    DrupalJsonApiRelationship
  >,
  TIncludedAttributes = Record<string, unknown>
> {
  jsonapi: {
    version: string;
  };

  data: DrupalJsonApiResource<
    TAttributes,
    TRelationships
  >[];

  included?: DrupalJsonApiResource<
    TIncludedAttributes
  >[];

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

/**
 * Resolves a single JSON:API relationship
 * against the response's included resources.
 */
export function getIncludedResource<
  TIncludedAttributes = Record<string, unknown>
>(
  response: DrupalResponse<
    Record<string, unknown>,
    Record<string, DrupalJsonApiRelationship>,
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
 * Resolves a multi-value JSON:API relationship
 * against the response's included resources.
 */
export function getIncludedResources<
  TIncludedAttributes = Record<string, unknown>
>(
  response: DrupalResponse<
    Record<string, unknown>,
    Record<string, DrupalJsonApiRelationship>,
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