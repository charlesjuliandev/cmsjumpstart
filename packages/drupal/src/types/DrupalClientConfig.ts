import type { DrupalAuth } from "./Auth";

export interface DrupalRequestOptions {
  headers?: Record<string, string>;
  cache?: RequestCache;
}

export interface DrupalClientConfig {
  baseUrl: string;
  auth?: DrupalAuth;
  headers?: Record<string, string>;
  request?: DrupalRequestOptions;
}

