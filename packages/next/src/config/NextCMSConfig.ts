import type {
  DrupalClientConfig
} from "@cmsjumpstart/drupal";

export interface NextCMSConfig {
  drupal: DrupalClientConfig;

  request?: {
    headers?: Record<string, string>;
    cache?: RequestCache;
  };
}