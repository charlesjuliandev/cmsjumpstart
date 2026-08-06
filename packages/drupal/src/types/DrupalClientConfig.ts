import type { DrupalAuth } from "./Auth";

export interface DrupalClientConfig {
  baseUrl: string;

  auth?: DrupalAuth;
}