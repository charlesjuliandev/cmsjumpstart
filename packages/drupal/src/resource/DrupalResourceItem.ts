import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiRelationshipIdentifier,
  DrupalJsonApiResource,
  DrupalRelationshipAttributes,
  DrupalRelationshipCardinality,
  DrupalRelationshipDefinitions,
  DrupalRelationshipRelationships
} from "../types/DrupalResponse";

type DrupalTypedRelationships<
  TDefinition
> =
  DrupalRelationshipRelationships<
    TDefinition
  > extends infer TRelationships
    ? TRelationships extends Record<
        string,
        DrupalJsonApiRelationship
      >
      ? TRelationships
      : Record<
          string,
          DrupalJsonApiRelationship
        >
    : Record<
        string,
        DrupalJsonApiRelationship
      >;

type DrupalTypedAttributes<
  TDefinition
> =
  DrupalRelationshipAttributes<
    TDefinition
  >;

type DrupalTypedRelationshipLinkage<
  TDefinition
> =
  DrupalRelationshipCardinality<
    TDefinition
  > extends "many"
    ? DrupalJsonApiRelationshipIdentifier[]
    : DrupalJsonApiRelationshipIdentifier | null;

export class DrupalResourceItem<
  TAttributes extends Record<
    string,
    unknown
  > = Record<string, unknown>,

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
  > = Record<string, unknown>,

  TRelationshipDefinitions extends
    DrupalRelationshipDefinitions =
      {}
> {
  constructor(
    private readonly resource:
      DrupalJsonApiResource<
        TAttributes,
        TRelationships
      >,

    private readonly included:
      | DrupalJsonApiResource<
          TIncludedAttributes
        >[]
      | undefined
  ) {}

  /**
   * Returns the JSON:API resource type.
   */
  get type(): string {
    return this.resource.type;
  }

  /**
   * Returns the JSON:API resource ID.
   */
  get id(): string {
    return this.resource.id;
  }

  /**
   * Returns the resource attributes.
   */
  get attributes(): TAttributes {
    return this.resource.attributes;
  }

  /**
   * Returns the raw JSON:API relationships.
   *
   * Relationship data is intentionally not normalized here.
   */
  get relationships():
    | TRelationships
    | undefined {
    return this.resource.relationships;
  }

  /**
   * Returns the resource links.
   */
  get links() {
    return this.resource.links;
  }

  /**
   * Returns the resource metadata.
   */
  get meta() {
    return this.resource.meta;
  }

  /**
   * Returns the raw JSON:API relationship linkage.
   *
   * When typed relationship definitions are available,
   * the relationship cardinality is preserved:
   *
   *   to-one  -> identifier | null
   *   to-many -> identifier[]
   *
   * For backwards-compatible untyped relationships,
   * the return value remains the general JSON:API
   * relationship data union.
   */
  relationshipLinkage<
    TRelationship extends keyof TRelationshipDefinitions
  >(
    relationship: TRelationship
  ): DrupalTypedRelationshipLinkage<
    TRelationshipDefinitions[
      TRelationship
    ]
  >;

  /**
   * Backwards-compatible overload for relationships
   * that have not yet been given typed definitions.
   */
  relationshipLinkage<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): TRelationships[
    TRelationship
  ]["data"] | null;

  relationshipLinkage(
    relationship: string
  ):
    | DrupalJsonApiRelationshipIdentifier
    | DrupalJsonApiRelationshipIdentifier[]
    | null {
    const relationshipData =
      this.resource.relationships?.[
        relationship as keyof TRelationships
      ]?.data;

    if (
      relationshipData === undefined
    ) {
      return null;
    }

    return relationshipData;
  }

  /**
   * Resolves a to-one relationship against the
   * included resources.
   *
   * The relationship definition determines the
   * attributes and relationships of the returned
   * DrupalResourceItem.
   */
  includedResource<
    TRelationship extends keyof TRelationshipDefinitions
  >(
    relationship: TRelationship
  ): DrupalResourceItem<
    DrupalTypedAttributes<
      TRelationshipDefinitions[
        TRelationship
      ]
    >,

    DrupalTypedRelationships<
      TRelationshipDefinitions[
        TRelationship
      ]
    >,

    TIncludedAttributes,

    TRelationshipDefinitions
  > | null;

  /**
   * Backwards-compatible overload for relationships
   * that have not yet been given typed definitions.
   */
  includedResource<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): DrupalResourceItem<
    TIncludedAttributes,
    Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes
  > | null;

  includedResource(
    relationship: string
  ):
    | DrupalResourceItem<
        Record<string, unknown>,
        Record<
          string,
          DrupalJsonApiRelationship
        >,
        TIncludedAttributes,
        DrupalRelationshipDefinitions
      >
    | null {
    const relationshipValue =
      this.resource.relationships?.[
        relationship as keyof TRelationships
      ];

    if (
      !relationshipValue?.data ||
      Array.isArray(
        relationshipValue.data
      )
    ) {
      return null;
    }

    const identifier =
      relationshipValue.data;

    const includedResource =
      this.included?.find(
        resource =>
          resource.type ===
            identifier.type &&
          resource.id ===
            identifier.id
      );

    if (!includedResource) {
      return null;
    }

    return new DrupalResourceItem<
      Record<string, unknown>,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      TIncludedAttributes,
      DrupalRelationshipDefinitions
    >(
      includedResource,
      this.included
    );
  }

  /**
   * Resolves a to-many relationship against the
   * included resources.
   *
   * The relationship definition determines the
   * attributes and relationships of each returned
   * DrupalResourceItem.
   */
  includedResources<
    TRelationship extends keyof TRelationshipDefinitions
  >(
    relationship: TRelationship
  ): DrupalResourceItem<
    DrupalTypedAttributes<
      TRelationshipDefinitions[
        TRelationship
      ]
    >,

    DrupalTypedRelationships<
      TRelationshipDefinitions[
        TRelationship
      ]
    >,

    TIncludedAttributes,

    TRelationshipDefinitions
  >[];

  /**
   * Backwards-compatible overload for relationships
   * that have not yet been given typed definitions.
   */
  includedResources<
    TRelationship extends keyof TRelationships
  >(
    relationship: TRelationship
  ): DrupalResourceItem<
    TIncludedAttributes,
    Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes
  >[];

  includedResources(
    relationship: string
  ):
    DrupalResourceItem<
      Record<string, unknown>,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      TIncludedAttributes,
      DrupalRelationshipDefinitions
    >[] {
    const relationshipValue =
      this.resource.relationships?.[
        relationship as keyof TRelationships
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

    const resources =
      this.included?.filter(
        resource =>
          identifiers.some(
            identifier =>
              resource.type ===
                identifier.type &&
              resource.id ===
                identifier.id
          )
      ) ?? [];

    return resources.map(
      resource =>
        new DrupalResourceItem<
          Record<string, unknown>,
          Record<
            string,
            DrupalJsonApiRelationship
          >,
          TIncludedAttributes,
          DrupalRelationshipDefinitions
        >(
          resource,
          this.included
        )
    );
  }

  /**
   * Returns the underlying raw JSON:API resource.
   *
   * This provides an escape hatch when developers need
   * the complete Drupal JSON:API representation.
   */
  toJSON(): DrupalJsonApiResource<
    TAttributes,
    TRelationships
  > {
    return this.resource;
  }
}