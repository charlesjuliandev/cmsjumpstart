import { DrupalClient } from "@cmsjumpstart/drupal";
import type {
  DrupalJsonApiRelationship,
  DrupalRelationshipDefinitions,
} from "@cmsjumpstart/drupal";
import { NextRequestExecutor } from "../executor/NextRequestExecutor";
import { NextCMSResource } from "../resource/NextCMSResource";
import type { NextCMSConfig } from "../config/NextCMSConfig";
export class NextCMSClient {
  private readonly drupal: DrupalClient;
  constructor(private readonly config: NextCMSConfig) {
    const drupalConfig = config.drupal;
    const executor = new NextRequestExecutor({
      baseUrl: drupalConfig.baseUrl,
      headers: { ...drupalConfig.headers, ...config.request?.headers },
      ...(config.request !== undefined ? { request: config.request } : {}),
    });
    this.drupal = new DrupalClient(drupalConfig, executor);
  }
  resource<
    TAttributes extends Record<string, unknown> = Record<string, unknown>,
    TRelationships extends Record<string, DrupalJsonApiRelationship> = Record<
      string,
      DrupalJsonApiRelationship
    >,
    TIncludedAttributes extends Record<string, unknown> = Record<
      string,
      unknown
    >,
    TRelationshipDefinitions extends DrupalRelationshipDefinitions = Record<
      string,
      never
    >,
  >(
    resourceType: string,
  ): NextCMSResource<
    TAttributes,
    TRelationships,
    TIncludedAttributes,
    TRelationshipDefinitions
  > {
    const resourceExecutor = new NextRequestExecutor({
      baseUrl: this.config.drupal.baseUrl,
      headers: { ...this.getHeaders(), ...this.config.request?.headers },
      ...(this.config.request !== undefined
        ? { request: this.config.request }
        : {}),
      resourceType,
    });
    const resource = this.drupal.resource<
      TAttributes,
      TRelationships,
      TIncludedAttributes,
      TRelationshipDefinitions
    >(resourceType, resourceExecutor);
    return new NextCMSResource(resource, resourceExecutor);
  }
  getHeaders(): Record<string, string> {
    return this.drupal.getHeaders();
  }
}
