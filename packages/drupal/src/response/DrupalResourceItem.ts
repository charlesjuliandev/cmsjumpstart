import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiResource
} from "../types/DrupalResponse";

export class DrupalResourceItem<
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
    private readonly resource: DrupalJsonApiResource<
      TAttributes,
      TRelationships
    >,
    private readonly included:
      | DrupalJsonApiResource<
          TIncludedAttributes
        >[]
      | undefined
  ) {}

  get type(): string {
    return this.resource.type;
  }

  get id(): string {
    return this.resource.id;
  }

  get attributes(): TAttributes {
    return this.resource.attributes;
  }

  get relationships():
    | TRelationships
    | undefined {
    return this.resource.relationships;
  }

  get links() {
    return this.resource.links;
  }

  get meta() {
    return this.resource.meta;
  }

  relationship<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): TRelationships[TRelationship]["data"] | null {
    const relationshipData =
      this.resource.relationships?.[
        relationship
      ]?.data;

    if (relationshipData === undefined) {
      return null;
    }

    return relationshipData;
  }

  includedResource<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): DrupalJsonApiResource<
    TIncludedAttributes
  > | null {
    const relationshipValue =
      this.resource.relationships?.[
        relationship
      ];

    if (
      !relationshipValue?.data ||
      Array.isArray(relationshipValue.data)
    ) {
      return null;
    }

    const identifier =
      relationshipValue.data;

    return (
      this.included?.find(
        resource =>
          resource.type === identifier.type &&
          resource.id === identifier.id
      ) ?? null
    );
  }

  includedResources<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): DrupalJsonApiResource<
    TIncludedAttributes
  >[] {
    const relationshipValue =
      this.resource.relationships?.[
        relationship
      ];

    if (!relationshipValue) {
      return [];
    }

    const data =
      relationshipValue.data;

    if (
      !data ||
      !Array.isArray(data)
    ) {
      return [];
    }

    const identifiers = data;

    return (
      this.included?.filter(
        resource =>
          identifiers.some(
            identifier =>
              resource.type === identifier.type &&
              resource.id === identifier.id
          )
      ) ?? []
    );
  }

  toJSON(): DrupalJsonApiResource<
    TAttributes,
    TRelationships
  > {
    return this.resource;
  }
}