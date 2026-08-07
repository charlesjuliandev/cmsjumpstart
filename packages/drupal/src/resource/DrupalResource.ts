import { DrupalQueryBuilder } from "../query/DrupalQueryBuilder";
import { DrupalQuerySerializer } from "../query/DrupalQuerySerializer";
import { RequestExecutor } from "../executor/RequestExecutor";

export class DrupalResource {
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

  async get<T>() {
    if (!this.executor) {
      throw new Error(
        "DrupalResource requires a RequestExecutor to execute requests."
      );
    }

    const params =
      DrupalQuerySerializer.serialize(
        this.query
      );

    return this.executor.get<T>(
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