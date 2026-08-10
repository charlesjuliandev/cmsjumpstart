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
  TRelationships = Record<string, DrupalJsonApiRelationship>
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
  TRelationships = Record<string, DrupalJsonApiRelationship>
> {
  jsonapi: {
    version: string;
  };

  data: DrupalJsonApiResource<
    TAttributes,
    TRelationships
  >[];

  included?: DrupalJsonApiResource[];

  links?: DrupalJsonApiLinks;

  meta?: Record<string, unknown>;
}