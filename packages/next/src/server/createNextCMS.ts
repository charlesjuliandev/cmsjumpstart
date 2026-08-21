import {
DrupalClient
} from "@cmsjumpstart/drupal";

import type {
NextCMSConfig
} from "../config/NextCMSConfig";

export function createNextCMS(
config: NextCMSConfig
): DrupalClient {
const drupalConfig = {
...config.drupal
};

if (config.request?.headers !== undefined) {
drupalConfig.request = {
headers: config.request.headers
};
}

return new DrupalClient(
drupalConfig
);
}
