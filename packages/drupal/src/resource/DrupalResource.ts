import { DrupalQueryBuilder } from "../query/DrupalQueryBuilder";
import { DrupalQuerySerializer } from "../query/DrupalQuerySerializer";
import { RequestExecutor } from "../executor/RequestExecutor";
import type {
  DrupalJsonApiRelationship,
  DrupalResponse
} from "../types/DrupalResponse";

export class DrupalResource<
  TAttributes = Record<string, unknown>,
  TRelationships = Record<
    string,
    DrupalJsonApiRelationship
  >
> {
  private query: DrupalQueryBuilder;

  constructor(
    private readonly resourceType: string,
    private readonly executor?: RequestExecutor
  ) {
    this.query =
      DrupalQueryBuilder.create(resourceType);
  }

  include(...fields: string[]) {
    this.query =
      this.query.include(...fields);

    return this;
  }

  filter(
    field: string,
    value: string | number | boolean
  ) {
    this.query =
      this.query.filter(
        field,
        value
      );

    return this;
  }

  sort(...fields: string[]) {
    this.query =
      this.query.sort(...fields);

    return this;
  }

  page(number: number) {
    this.query =
      this.query.page(number);

    return this;
  }

  limit(number: number) {
    this.query =
      this.query.limit(number);

    return this;
  }

  getQuery() {
    return this.query;
  }

  async get(): Promise<
    DrupalResponse<
      TAttributes,
      TRelationships
    >
  > {
    if (!this.executor) {
      throw new Error(
        "DrupalResource requires a RequestExecutor to execute requests."
      );
    }

    const params =
      DrupalQuerySerializer.serialize(
        this.query
      );

    return this.executor.get<
      TAttributes,
      TRelationships
    >(
      `/jsonapi/${this.getEndpoint()}`,
      params
    );
  }

  private getEndpoint() {
    return this.resourceType.replace(
      "--",
      "/"
    );
  }
}