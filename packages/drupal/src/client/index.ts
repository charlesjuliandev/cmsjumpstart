import { DrupalClient } from "./DrupalClient";
import type { DrupalClientConfig } from "../types/DrupalClientConfig";

export interface CreateDrupalClientOptions
  extends Omit<DrupalClientConfig, "auth"> {
  apiKey?: string;
  auth?: DrupalClientConfig["auth"];
}

export function createDrupalClient(
  config: CreateDrupalClientOptions
): DrupalClient {
  const { apiKey, auth, ...rest } = config;

  const clientConfig: DrupalClientConfig = {
    ...rest
  };

  const resolvedAuth =
    auth ??
    (apiKey
      ? {
          type: "api-key" as const,
          key: apiKey
        }
      : undefined);

  if (resolvedAuth) {
    clientConfig.auth = resolvedAuth;
  }

  return new DrupalClient(clientConfig);
}

export { DrupalClient };