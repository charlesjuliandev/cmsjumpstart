import {
  DrupalClient
} from "@cmsjumpstart/drupal";

import type {
  DrupalJsonApiRelationship,
  DrupalRelationshipDefinitions
} from "@cmsjumpstart/drupal";

import {
  NextRequestExecutor
} from "../executor/NextRequestExecutor";

import {
  NextCMSResource
} from "../resource/NextCMSResource";

import type {
  NextCMSConfig
} from "../config/NextCMSConfig";

export class NextCMSClient {
  private readonly drupal:
    DrupalClient;

  constructor(
    config: NextCMSConfig
  ) {
    const drupalConfig =
      config.drupal;

    const executorOptions = {
      baseUrl:
        drupalConfig.baseUrl,
      ...(drupalConfig.headers !== undefined
        ? {
            headers:
              drupalConfig.headers
          }
        : {}),
      ...(drupalConfig.request !== undefined
        ? {
            request:
              drupalConfig.request
          }
        : {})
    };

    const executor =
      new NextRequestExecutor(
        executorOptions
      );

    this.drupal =
      new DrupalClient(
        drupalConfig,
        executor
      );
  }

  resource<
    TAttributes extends
      Record<string, unknown> =
        Record<string, unknown>,

    TRelationships extends Record<
      string,
      DrupalJsonApiRelationship
    > = Record<
      string,
      DrupalJsonApiRelationship
    >,

    TIncludedAttributes extends
      Record<string, unknown> =
        Record<string, unknown>,

    TRelationshipDefinitions extends
      DrupalRelationshipDefinitions =
        Record<string, never>
  >(
    resourceType: string
  ): NextCMSResource<
    TAttributes,
    TRelationships,
    TIncludedAttributes,
    TRelationshipDefinitions
  > {
    const resource =
      this.drupal.resource<
        TAttributes,
        TRelationships,
        TIncludedAttributes,
        TRelationshipDefinitions
      >(resourceType);

    return new NextCMSResource(
      resource
    );
  }

  getHeaders():
    Record<string, string> {
    return this.drupal.getHeaders();
  }
}

