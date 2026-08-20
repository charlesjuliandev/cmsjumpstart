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
   * Developers can inspect the complete Drupal relationship
   * structure when they need it.
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
   * Returns the raw JSON:API relationship data.
   *
   * This preserves Drupal's original relationship structure,
   * including resource identifiers, metadata, and links.
   */
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

  /**
   * Resolves a to-one relationship against the included
   * resources and returns the result as a DrupalResourceItem.
   *
   * The complete included collection is passed to the returned
   * item so nested relationship traversal remains possible.
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
    >
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

    const includedResource =
      this.included?.find(
        resource =>
          resource.type === identifier.type &&
          resource.id === identifier.id
      );

    if (!includedResource) {
      return null;
    }

    return new DrupalResourceItem<
      TIncludedAttributes,
      Record<
        string,
        DrupalJsonApiRelationship
      >,
      TIncludedAttributes
    >(
      includedResource,
      this.included
    );
  }

  /**
   * Resolves a to-many relationship against the included
   * resources and returns the results as DrupalResourceItems.
   *
   * Resources that are referenced by the relationship but
   * missing from the included collection are ignored.
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
    >
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

    const resources =
      this.included?.filter(
        resource =>
          identifiers.some(
            identifier =>
              resource.type === identifier.type &&
              resource.id === identifier.id
          )
      ) ?? [];

    return resources.map(
      resource =>
        new DrupalResourceItem<
          TIncludedAttributes,
          Record<
            string,
            DrupalJsonApiRelationship
          >,
          TIncludedAttributes
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