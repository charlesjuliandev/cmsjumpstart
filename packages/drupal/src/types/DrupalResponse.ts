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

export interface DrupalJsonApiRelationship {
  data:
    | DrupalJsonApiRelationshipIdentifier
    | DrupalJsonApiRelationshipIdentifier[]
    | null;

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}

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