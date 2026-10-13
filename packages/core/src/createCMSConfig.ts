import type { CMSJumpstartConfig } from "./config.js";

export function createCMSConfig(
  config: CMSJumpstartConfig
): CMSJumpstartConfig {

  return {
    ...config,
    features: {
      search: false,
      preview: false,
      ...config.features
    }
  };
}