import {
  NextCMSClient
} from "../client/NextCMSClient";

import type {
  NextCMSConfig
} from "../config/NextCMSConfig";

export function createNextCMS(
  config: NextCMSConfig
): NextCMSClient {
  return new NextCMSClient(
    config
  );
}
