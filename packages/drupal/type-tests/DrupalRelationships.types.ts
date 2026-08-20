import type {
  DrupalJsonApiRelationship,
  DrupalJsonApiResource,
  DrupalRelationshipDefinitions,
  DrupalToManyRelationship,
  DrupalToOneRelationship
} from "../src/types/DrupalResponse";

import {
  DrupalResourceItem
} from "../src/resource/DrupalResourceItem";

import {
  DrupalResourceResponse
} from "../src/response/DrupalResourceResponse";

/**
 * --------------------------------------------------------------------------
 * Test resource definitions
 * --------------------------------------------------------------------------
 */

type ThumbnailAttributes = {
  url: string;
};

type ThumbnailRelationships = {};

type ImageAttributes = {
  name: string;
  alt: string;
};

type ImageRelationships = {
  field_thumbnail: DrupalJsonApiRelationship;
};

type TagAttributes = {
  name: string;
};

type TagRelationships = {};

type EventAttributes = {
  title: string;
};

type EventRelationships = {
  field_image: DrupalJsonApiRelationship;
  field_tags: DrupalJsonApiRelationship;
};

/**
 * --------------------------------------------------------------------------
 * Typed relationship definitions
 * --------------------------------------------------------------------------
 */

type ImageRelationshipDefinitions = {
  field_thumbnail: DrupalToOneRelationship<
    ThumbnailAttributes,
    ThumbnailRelationships
  >;
};

type EventRelationshipDefinitions = {
  field_image: DrupalToOneRelationship<
    ImageAttributes,
    ImageRelationships
  >;

  field_tags: DrupalToManyRelationship<
    TagAttributes,
    TagRelationships
  >;
};

type NestedRelationshipDefinitions = {
  field_image: DrupalToOneRelationship<
    ImageAttributes,
    ImageRelationships
  >;

  field_tags: DrupalToManyRelationship<
    TagAttributes,
    TagRelationships
  >;
};

type ValidRelationshipDefinitions =
  DrupalRelationshipDefinitions;

/**
 * --------------------------------------------------------------------------
 * Relationship definition compatibility
 * --------------------------------------------------------------------------
 */

const eventRelationshipDefinitions:
  EventRelationshipDefinitions =
  {
    field_image: {
      attributes: {} as ImageAttributes,
      relationships: {} as ImageRelationships,
      cardinality: "one"
    },

    field_tags: {
      attributes: {} as TagAttributes,
      relationships: {} as TagRelationships,
      cardinality: "many"
    }
  };

const validRelationshipDefinitions:
  ValidRelationshipDefinitions =
  eventRelationshipDefinitions;

void validRelationshipDefinitions;

/**
 * --------------------------------------------------------------------------
 * DrupalResourceItem
 * --------------------------------------------------------------------------
 */

const eventResource:
  DrupalJsonApiResource<
    EventAttributes,
    EventRelationships
  > = {
  type: "node--event",

  id: "event-1",

  attributes: {
    title: "Community Event"
  },

  relationships: {
    field_image: {
      data: {
        type: "media--image",
        id: "image-1"
      }
    },

    field_tags: {
      data: [
        {
          type: "taxonomy_term--tags",
          id: "tag-1"
        }
      ]
    }
  }
};

const imageResource:
  DrupalJsonApiResource<
    ImageAttributes,
    ImageRelationships
  > = {
  type: "media--image",

  id: "image-1",

  attributes: {
    name: "Event Image",
    alt: "Community event"
  },

  relationships: {
    field_thumbnail: {
      data: {
        type: "media--image",
        id: "thumbnail-1"
      }
    }
  }
};

const tagResource:
  DrupalJsonApiResource<
    TagAttributes,
    TagRelationships
  > = {
  type: "taxonomy_term--tags",

  id: "tag-1",

  attributes: {
    name: "Community"
  }
};

const thumbnailResource:
  DrupalJsonApiResource<
    ThumbnailAttributes,
    ThumbnailRelationships
  > = {
  type: "media--image",

  id: "thumbnail-1",

  attributes: {
    url: "https://example.com/thumbnail.jpg"
  }
};

const includedResources:
  DrupalJsonApiResource<
    ImageAttributes,
    ImageRelationships
  >[] = [
  imageResource
];

const eventItem =
  new DrupalResourceItem<
    EventAttributes,
    EventRelationships,
    ImageAttributes,
    EventRelationshipDefinitions
  >(
    eventResource,
    includedResources
  );

/**
 * The primary resource's attributes remain strongly typed.
 */
const eventTitle: string =
  eventItem.attributes.title;

void eventTitle;

/**
 * The primary resource should not expose arbitrary
 * attributes that aren't part of EventAttributes.
 */
// @ts-expect-error — invalid attribute must be rejected
eventItem.attributes.doesNotExist;

/**
 * --------------------------------------------------------------------------
 * Typed to-one relationship
 * --------------------------------------------------------------------------
 */

const image =
  eventItem.includedResource(
    "field_image"
  );

if (image) {
  const imageName: string =
    image.attributes.name;

  const imageAlt: string =
    image.attributes.alt;

  void imageName;
  void imageAlt;

  /**
   * The included image should expose ImageAttributes,
   * not arbitrary attributes.
   */
  // @ts-expect-error — invalid attribute must be rejected
  image.attributes.doesNotExist;
}

/**
 * --------------------------------------------------------------------------
 * Typed to-many relationship
 * --------------------------------------------------------------------------
 */

const tags =
  eventItem.includedResources(
    "field_tags"
  );

tags.forEach(tag => {
  const tagName: string =
    tag.attributes.name;

  void tagName;

  /**
   * The included tag should expose TagAttributes.
   */
  // @ts-expect-error — invalid attribute must be rejected
  tag.attributes.doesNotExist;
});

/**
 * --------------------------------------------------------------------------
 * Invalid relationship names
 * --------------------------------------------------------------------------
 */

/**
 * Only relationships declared in EventRelationshipDefinitions
 * should be accepted.
 */
eventItem.includedResource(
  // @ts-expect-error — invalid relationship must be rejected
  "doesNotExist"
);

/**
 * Only relationships declared in EventRelationshipDefinitions
 * should be accepted.
 */
eventItem.includedResources(
  // @ts-expect-error — invalid relationship must be rejected
  "doesNotExist"
);

/**
 * --------------------------------------------------------------------------
 * Relationship linkage remains available
 * --------------------------------------------------------------------------
 */

const imageLinkage =
  eventItem.relationshipLinkage(
    "field_image"
  );

if (imageLinkage) {
  if (!Array.isArray(imageLinkage)) {
    const imageType: string =
      imageLinkage.type;

    const imageId: string =
      imageLinkage.id;

    void imageType;
    void imageId;
  }
}

const tagLinkage =
  eventItem.relationshipLinkage(
    "field_tags"
  );

if (tagLinkage) {
  if (Array.isArray(tagLinkage)) {
    tagLinkage.forEach(
      identifier => {
        const tagType: string =
          identifier.type;

        const tagId: string =
          identifier.id;

        void tagType;
        void tagId;
      }
    );
  }
}

/**
 * --------------------------------------------------------------------------
 * Nested included-resource typing
 * --------------------------------------------------------------------------
 */

const nestedImageItem =
  new DrupalResourceItem<
    ImageAttributes,
    ImageRelationships,
    ThumbnailAttributes,
    ImageRelationshipDefinitions
  >(
    imageResource,
    [
      thumbnailResource
    ]
  );

const thumbnail =
  nestedImageItem.includedResource(
    "field_thumbnail"
  );

if (thumbnail) {
  const thumbnailUrl: string =
    thumbnail.attributes.url;

  void thumbnailUrl;

  /**
   * The nested included resource should expose
   * ThumbnailAttributes.
   */
  // @ts-expect-error — invalid attribute must be rejected
  thumbnail.attributes.doesNotExist;
}

/**
 * --------------------------------------------------------------------------
 * DrupalResourceResponse
 * --------------------------------------------------------------------------
 */

const response =
  new DrupalResourceResponse<
    EventAttributes,
    EventRelationships,
    ImageAttributes,
    EventRelationshipDefinitions
  >(
    {
      jsonapi: {
        version: "1.0"
      },

      data: [
        eventResource
      ],

      included: includedResources
    }
  );

/**
 * getOne() preserves the relationship definitions.
 */
const responseEvent =
  response.getOne();

if (responseEvent) {
  const responseImage =
    responseEvent.includedResource(
      "field_image"
    );

  if (responseImage) {
    const responseImageName: string =
      responseImage.attributes.name;

    const responseImageAlt: string =
      responseImage.attributes.alt;

    void responseImageName;
    void responseImageAlt;
  }

  const responseTags =
    responseEvent.includedResources(
      "field_tags"
    );

  responseTags.forEach(tag => {
    const responseTagName: string =
      tag.attributes.name;

    void responseTagName;
  });

  /**
   * Invalid relationships should remain rejected
   * after going through DrupalResourceResponse.
   */
  responseEvent.includedResource(
    // @ts-expect-error — invalid relationship must be rejected
    "doesNotExist"
  );
}

/**
 * getAll() also preserves the relationship definitions.
 */
const responseEvents =
  response.getAll();

responseEvents.forEach(event => {
  const image =
    event.includedResource(
      "field_image"
    );

  if (image) {
    const name: string =
      image.attributes.name;

    void name;
  }

  const tags =
    event.includedResources(
      "field_tags"
    );

  tags.forEach(tag => {
    const name: string =
      tag.attributes.name;

    void name;
  });
});

/**
 * --------------------------------------------------------------------------
 * Backward-compatible untyped usage
 * --------------------------------------------------------------------------
 *
 * Consumers that don't provide relationship definitions should
 * continue to be able to use the existing API.
 */

const legacyItem =
  new DrupalResourceItem<
    EventAttributes,
    EventRelationships,
    ImageAttributes
  >(
    eventResource,
    includedResources
  );

const legacyImage =
  legacyItem.includedResource(
    "field_image"
  );

if (legacyImage) {
  const legacyName: string =
    legacyImage.attributes.name;

  void legacyName;
}

/**
 * Existing relationship keys remain valid for legacy usage.
 */
const legacyTags =
  legacyItem.includedResources(
    "field_tags"
  );

legacyTags.forEach(tag => {
  const legacyAttributes =
    tag.attributes;

  void legacyAttributes;
});

/**
 * --------------------------------------------------------------------------
 * Compile-time relationship-definition aliases
 * --------------------------------------------------------------------------
 */

void ({} as NestedRelationshipDefinitions);
void ({} as ValidRelationshipDefinitions);