const CACHE_TAG_PREFIX =
  "cmsjumpstart:drupal";

export function getResourceCacheTags(
  resourceType: string,
  resourceId?: string
): string[] {
  if (!resourceType) {
    throw new Error(
      "Resource type is required to generate cache tags."
    );
  }

  const collectionTag =
    `${CACHE_TAG_PREFIX}:${resourceType}`;

  if (resourceId === undefined) {
    return [
      collectionTag
    ];
  }

  if (!resourceId) {
    throw new Error(
      "Resource ID cannot be empty when generating a resource cache tag."
    );
  }

  return [
    collectionTag,
    `${collectionTag}:${resourceId}`
  ];
}

