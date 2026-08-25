import {
  DrupalClient
} from "@cmsjumpstart/drupal";

import type {
  DrupalJsonApiRelationship,
  DrupalRelationshipDefinitions
} from "@cmsjumpstart/drupal";

import type {
  NextCMSConfig
} from "../config/NextCMSConfig";

import {
  NextCMSResource
} from "../resource/NextCMSResource";

export class NextCMSClient {
  private readonly drupal: DrupalClient;

  constructor(
    config: NextCMSConfig
  ) {
    this.drupal =
      new DrupalClient({
        ...config.drupal
      });
  }

  resource<
    TAttributes extends Record<string, unknown> =
      Record<string, unknown>,

    TRelationships extends Record<
      string,
      DrupalJsonApiRelationship
    > = Record<
      string,
      DrupalJsonApiRelationship
    >,

    TIncludedAttributes extends Record<
      string,
      unknown
    > = Record<string, unknown>,

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

  getHeaders(): Record<string, string> {
    return this.drupal.getHeaders();
  }
}

