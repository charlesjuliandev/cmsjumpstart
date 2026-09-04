import {
  revalidateTag
} from "next/cache";

import {
  getResourceCacheTags
} from "../cache/cacheTags";

export function revalidateResource(
  resourceType: string,
  resourceId?: string
): void {
  const tags =
    getResourceCacheTags(
      resourceType,
      resourceId
    );

  for (const tag of tags) {
    revalidateTag(
      tag,
      "max"
    );
  }
}

