import type {
  DrupalClientConfig
} from "../types/DrupalClientConfig";

import {
  DrupalQueryBuilder
} from "../query/DrupalQueryBuilder";

import {
  DrupalResource
} from "../resource/DrupalResource";


export class DrupalClient {

  constructor(
    private readonly config: DrupalClientConfig
  ) {}

  
  resource(
    resourceType: string
    ) {
        return new DrupalResource(
            resourceType
    );
    }


  async request(
    url: string,
    options?: RequestInit
  ) {

    const headers: Record<string, string> = {
        Accept: "application/vnd.api+json",
        ...this.config.headers
    };


    if (this.config.apiKey) {
      headers.Authorization =
        `Bearer ${this.config.apiKey}`;
    }


    return fetch(
      `${this.config.baseUrl}${url}`,
      {
        ...options,
        headers
      }
    );
  }
}