import type { DrupalQueryOptions } from "./types";

export class DrupalQueryBuilder {
  private constructor(
    private readonly resourceType: string,
    private readonly options: DrupalQueryOptions = {}
  ) {}

  static create(resourceType: string) {
    return new DrupalQueryBuilder(resourceType);
  }

  include(...fields: string[]) {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        includes: [
          ...(this.options.includes ?? []),
          ...fields
        ]
      }
    );
  }

  filter(
    field: string,
    value: string | number | boolean
  ) {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        filters: {
          ...(this.options.filters ?? {}),
          [field]: value
        }
      }
    );
  }

  sort(...fields: string[]) {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        sort: fields
      }
    );
  }

  page(number: number) {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        page: number
      }
    );
  }

  limit(number: number) {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        limit: number
      }
    );
  }

  getResourceType() {
    return this.resourceType;
  }

  getOptions() {
    return this.options;
  }
}