import type { DrupalAuth } from "./Auth";

export interface DrupalRequestOptions {
  headers?: Record<string, string>;
}

export interface DrupalClientConfig {
  baseUrl: string;
  auth?: DrupalAuth;
  headers?: Record<string, string>;
  request?: DrupalRequestOptions;
}
