import type {
  DrupalFilterOperator,
  DrupalFilterValue,
  DrupalQueryOptions
} from "./types";

export class DrupalQueryBuilder {
  private constructor(
    private readonly resourceType: string,
    private readonly options: DrupalQueryOptions = {}
  ) {}

  static create(
    resourceType: string
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      resourceType
    );
  }

  include(
    ...fields: string[]
  ): DrupalQueryBuilder {
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

  fields(
    ...fields: string[]
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        fields
      }
    );
  }

  /**
   * Adds an equality filter.
   *
   * Example:
   *
   * filter("status", true)
   *
   * Serializes to:
   *
   * filter[status]=true
   */
  filter(
    field: string,
    value: DrupalFilterValue
  ): DrupalQueryBuilder;

  /**
   * Adds a comparison, string, collection,
   * or range filter.
   *
   * Example:
   *
   * filter(
   *   "field_date.value",
   *   ">=",
   *   "2026-08-13"
   * )
   */
  filter(
    field: string,
    operator: Exclude<
      DrupalFilterOperator,
      "IS NULL" | "IS NOT NULL"
    >,
    value: DrupalFilterValue
  ): DrupalQueryBuilder;

  /**
   * Adds a NULL filter.
   *
   * Example:
   *
   * filter(
   *   "field_image",
   *   "IS NULL"
   * )
   */
  filter(
    field: string,
    operator:
      | "IS NULL"
      | "IS NOT NULL"
  ): DrupalQueryBuilder;

  filter(
    field: string,
    operatorOrValue:
      | DrupalFilterOperator
      | DrupalFilterValue,
    value?: DrupalFilterValue
  ): DrupalQueryBuilder {
    const isOperator =
      typeof operatorOrValue === "string" &&
      this.isFilterOperator(
        operatorOrValue
      );

    /*
     * A two-argument call is normally an
     * equality filter.
     *
     * IS NULL and IS NOT NULL are the
     * intentional exceptions because they
     * do not have a filter value.
     */
    if (
      value === undefined &&
      !(
        isOperator &&
        (
          operatorOrValue === "IS NULL" ||
          operatorOrValue === "IS NOT NULL"
        )
      )
    ) {
      return new DrupalQueryBuilder(
        this.resourceType,
        {
          ...this.options,

          filters: [
            ...(this.options.filters ?? []),

            {
              field,
              operator: "=",
              value: operatorOrValue
            }
          ]
        }
      );
    }

    if (
      isOperator &&
      (
        operatorOrValue === "IS NULL" ||
        operatorOrValue === "IS NOT NULL"
      )
    ) {
      return new DrupalQueryBuilder(
        this.resourceType,
        {
          ...this.options,

          filters: [
            ...(this.options.filters ?? []),

            {
              field,
              operator: operatorOrValue
            }
          ]
        }
      );
    }

    if (!isOperator) {
      throw new Error(
        `Invalid filter operator "${String(
          operatorOrValue
        )}".`
      );
    }

    if (value === undefined) {
      throw new Error(
        `Filter "${operatorOrValue}" requires a value.`
      );
    }

    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,

        filters: [
          ...(this.options.filters ?? []),

          {
            field,
            operator: operatorOrValue,
            value
          }
        ]
      }
    );
  }

  sort(
    ...fields: string[]
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        sort: fields
      }
    );
  }

  page(
    number: number
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        page: number
      }
    );
  }

  limit(
    number: number
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,
        limit: number
      }
    );
  }

  getResourceType(): string {
    return this.resourceType;
  }

  getOptions(): DrupalQueryOptions {
    return this.options;
  }

  private isFilterOperator(
    value: string
  ): value is DrupalFilterOperator {
    return [
      "=",
      "<>",
      ">",
      ">=",
      "<",
      "<=",
      "STARTS_WITH",
      "CONTAINS",
      "ENDS_WITH",
      "IN",
      "NOT IN",
      "BETWEEN",
      "NOT BETWEEN",
      "IS NULL",
      "IS NOT NULL"
    ].includes(
      value as DrupalFilterOperator
    );
  }
}