import {
  DrupalClient
} from "./DrupalClient";

import type {
  DrupalClientConfig
} from "../types/DrupalClientConfig";


export function createDrupalClient(
  config: DrupalClientConfig
) {
  return new DrupalClient(config);
}


export {
  DrupalClient
};