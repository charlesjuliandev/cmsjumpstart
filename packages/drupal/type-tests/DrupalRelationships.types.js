"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var DrupalResourceItem_1 = require("../src/resource/DrupalResourceItem");
var DrupalResourceResponse_1 = require("../src/response/DrupalResourceResponse");
/**
 * --------------------------------------------------------------------------
 * Relationship definition compatibility
 * --------------------------------------------------------------------------
 */
var eventRelationshipDefinitions = {
    field_image: {
        attributes: {},
        relationships: {},
        cardinality: "one"
    },
    field_tags: {
        attributes: {},
        relationships: {},
        cardinality: "many"
    }
};
var validRelationshipDefinitions = eventRelationshipDefinitions;
void validRelationshipDefinitions;
/**
 * --------------------------------------------------------------------------
 * DrupalResourceItem
 * --------------------------------------------------------------------------
 */
var eventResource = {
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
var imageResource = {
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
var tagResource = {
    type: "taxonomy_term--tags",
    id: "tag-1",
    attributes: {
        name: "Community"
    }
};
var thumbnailResource = {
    type: "media--image",
    id: "thumbnail-1",
    attributes: {
        url: "https://example.com/thumbnail.jpg"
    }
};
var includedResources = [
    imageResource
];
var eventItem = new DrupalResourceItem_1.DrupalResourceItem(eventResource, includedResources);
/**
 * The primary resource's attributes remain strongly typed.
 */
var eventTitle = eventItem.attributes.title;
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
var image = eventItem.includedResource("field_image");
if (image) {
    var imageName = image.attributes.name;
    var imageAlt = image.attributes.alt;
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
var tags = eventItem.includedResources("field_tags");
tags.forEach(function (tag) {
    var tagName = tag.attributes.name;
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
"doesNotExist");
/**
 * Only relationships declared in EventRelationshipDefinitions
 * should be accepted.
 */
eventItem.includedResources(
// @ts-expect-error — invalid relationship must be rejected
"doesNotExist");
/**
 * --------------------------------------------------------------------------
 * Relationship linkage remains available
 * --------------------------------------------------------------------------
 */
var imageLinkage = eventItem.relationshipLinkage("field_image");
if (imageLinkage) {
    if (!Array.isArray(imageLinkage)) {
        var imageType = imageLinkage.type;
        var imageId = imageLinkage.id;
        void imageType;
        void imageId;
    }
}
var tagLinkage = eventItem.relationshipLinkage("field_tags");
if (tagLinkage) {
    if (Array.isArray(tagLinkage)) {
        tagLinkage.forEach(function (identifier) {
            var tagType = identifier.type;
            var tagId = identifier.id;
            void tagType;
            void tagId;
        });
    }
}
/**
 * --------------------------------------------------------------------------
 * Nested included-resource typing
 * --------------------------------------------------------------------------
 */
var nestedImageItem = new DrupalResourceItem_1.DrupalResourceItem(imageResource, [
    thumbnailResource
]);
var thumbnail = nestedImageItem.includedResource("field_thumbnail");
if (thumbnail) {
    var thumbnailUrl = thumbnail.attributes.url;
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
var response = new DrupalResourceResponse_1.DrupalResourceResponse({
    jsonapi: {
        version: "1.0"
    },
    data: [
        eventResource
    ],
    included: includedResources
});
/**
 * getOne() preserves the relationship definitions.
 */
var responseEvent = response.getOne();
if (responseEvent) {
    var responseImage = responseEvent.includedResource("field_image");
    if (responseImage) {
        var responseImageName = responseImage.attributes.name;
        var responseImageAlt = responseImage.attributes.alt;
        void responseImageName;
        void responseImageAlt;
    }
    var responseTags = responseEvent.includedResources("field_tags");
    responseTags.forEach(function (tag) {
        var responseTagName = tag.attributes.name;
        void responseTagName;
    });
    /**
     * Invalid relationships should remain rejected
     * after going through DrupalResourceResponse.
     */
    responseEvent.includedResource(
    // @ts-expect-error — invalid relationship must be rejected
    "doesNotExist");
}
/**
 * getAll() also preserves the relationship definitions.
 */
var responseEvents = response.getAll();
responseEvents.forEach(function (event) {
    var image = event.includedResource("field_image");
    if (image) {
        var name_1 = image.attributes.name;
        void name_1;
    }
    var tags = event.includedResources("field_tags");
    tags.forEach(function (tag) {
        var name = tag.attributes.name;
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
var legacyItem = new DrupalResourceItem_1.DrupalResourceItem(eventResource, includedResources);
var legacyImage = legacyItem.includedResource("field_image");
if (legacyImage) {
    var legacyName = legacyImage.attributes.name;
    void legacyName;
}
/**
 * Existing relationship keys remain valid for legacy usage.
 */
var legacyTags = legacyItem.includedResources("field_tags");
legacyTags.forEach(function (tag) {
    var legacyAttributes = tag.attributes;
    void legacyAttributes;
});
/**
 * --------------------------------------------------------------------------
 * Compile-time relationship-definition aliases
 * --------------------------------------------------------------------------
 */
void {};
void {};
