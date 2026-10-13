import {
  NextCMSClient
} from "../client/NextCMSClient.js";

import type {
  NextCMSConfig
} from "../config/NextCMSConfig.js";

export function createNextCMS(
  config: NextCMSConfig
): NextCMSClient {
  return new NextCMSClient(
    config
  );
}
