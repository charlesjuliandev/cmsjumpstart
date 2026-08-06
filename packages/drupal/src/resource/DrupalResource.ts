import {
  DrupalQueryBuilder
} from "../query/DrupalQueryBuilder";


export class DrupalResource {

  private query: DrupalQueryBuilder;

  constructor(
    private readonly resourceType: string
  ) {
    this.query =
      DrupalQueryBuilder.create(
        resourceType
      );
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
}