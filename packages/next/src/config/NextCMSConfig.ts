import type {
  DrupalClientConfig
} from "@cmsjumpstart/drupal";

import type {
  NextRequestOptions
} from "../executor/NextRequestExecutor";

export interface NextCMSConfig {
  /**
   * Drupal CMS configuration.
   */
  drupal: DrupalClientConfig;

  /**
   * Next.js request options.
   *
   * Controls Next.js fetch caching and
   * cache revalidation behavior.
   */
  request?: NextRequestOptions;
}