import type {
  DrupalJsonApiRelationship,
  DrupalToManyRelationship,
  DrupalToOneRelationship
} from "../types/DrupalResponse";

import type {
  DrupalResourceItem
} from "./DrupalResourceItem";

type EventAttributes = {
  title: string;
};

type ImageAttributes = {
  name: string;
  alt: string;
};

type TagAttributes = {
  name: string;
};

type ImageRelationships = {
  field_thumbnail: DrupalJsonApiRelationship;
};

type EventRelationships = {
  field_image: DrupalJsonApiRelationship;

  field_tags: DrupalJsonApiRelationship;
};

type EventRelationshipDefinitions = {
  field_image:
    DrupalToOneRelationship<
      ImageAttributes,
      ImageRelationships
    >;

  field_tags:
    DrupalToManyRelationship<
      TagAttributes
    >;
};

declare const event:
  DrupalResourceItem<
    EventAttributes,
    EventRelationships,
    ImageAttributes,
    EventRelationshipDefinitions
  >;

/**
 * Attributes remain strongly typed.
 */
const title: string =
  event.attributes.title;

void title;

/**
 * A defined to-one relationship resolves
 * to the relationship's declared attributes.
 */
const image =
  event.includedResource(
    "field_image"
  );

const imageName: string =
  image!.attributes.name;

const imageAlt: string =
  image!.attributes.alt;

void imageName;
void imageAlt;

/**
 * Nested relationship definitions survive
 * included-resource traversal.
 */
const thumbnail =
  image!.relationshipLinkage(
    "field_thumbnail"
  );

void thumbnail;

/**
 * A defined to-many relationship resolves
 * to an array whose items use the declared
 * related-resource attributes.
 */
const tags =
  event.includedResources(
    "field_tags"
  );

const firstTag = tags[0];

if (firstTag) {
  firstTag.attributes.name;
}

/**
 * Included-resource attributes are not reduced
 * to Record<string, unknown>.
 */
const typedImage:
  ImageAttributes =
  image!.attributes;

void typedImage;

/**
 * Backwards-compatible relationship typing
 * remains available when no definitions are supplied.
 */
declare const legacyEvent:
  DrupalResourceItem<
    EventAttributes,
    EventRelationships,
    ImageAttributes
  >;

const legacyImage =
  legacyEvent.includedResource(
    "field_image"
  );

const legacyImageName: string =
  legacyImage!.attributes.name;

void legacyImageName;

const legacyTags =
  legacyEvent.includedResources(
    "field_tags"
  );

const firstLegacyTag = legacyTags[0];

if (firstLegacyTag) {
  firstLegacyTag.attributes.name;
}

/**
 * Raw relationship linkage remains tied to the
 * original JSON:API relationship map.
 */
const imageLinkage =
  event.relationshipLinkage(
    "field_image"
  );

if (imageLinkage) {
  const imageType: string =
    imageLinkage.type;

  const imageId: string =
    imageLinkage.id;

  void imageType;
  void imageId;
}

const tagLinkage =
  event.relationshipLinkage(
    "field_tags"
  );

if (tagLinkage) {
  for (const identifier of tagLinkage) {
    const tagType: string =
      identifier.type;

    const tagId: string =
      identifier.id;

    void tagType;
    void tagId;
  }
}