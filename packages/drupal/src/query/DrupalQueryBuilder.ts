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
     * A two-argument call is an equality
     * filter unless the value is one of the
     * unary NULL operators.
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
      return this.addFilter({
        field,
        operator: "=",
        value: operatorOrValue
      });
    }

    /*
     * IS NULL and IS NOT NULL do not accept
     * a filter value.
     */
    if (
      isOperator &&
      (
        operatorOrValue === "IS NULL" ||
        operatorOrValue === "IS NOT NULL"
      )
    ) {
      return this.addFilter({
        field,
        operator: operatorOrValue
      });
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

    const comparisonOperator =
      operatorOrValue as Exclude<
        DrupalFilterOperator,
        "IS NULL" | "IS NOT NULL"
      >;

    this.validateFilterValue(
      comparisonOperator,
      value
    );

    return this.addFilter({
      field,
      operator: comparisonOperator,
      value
    });
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

  private addFilter(
    filter: {
      field: string;
      operator: DrupalFilterOperator;
      value?: DrupalFilterValue;
    }
  ): DrupalQueryBuilder {
    return new DrupalQueryBuilder(
      this.resourceType,
      {
        ...this.options,

        filters: [
          ...(this.options.filters ?? []),
          filter
        ]
      }
    );
  }

  private validateFilterValue(
    operator: Exclude<
      DrupalFilterOperator,
      "IS NULL" | "IS NOT NULL"
    >,
    value: DrupalFilterValue
  ): void {
    const requiresArray =
      operator === "IN" ||
      operator === "NOT IN" ||
      operator === "BETWEEN" ||
      operator === "NOT BETWEEN";

    if (requiresArray) {
      if (!Array.isArray(value)) {
        throw new Error(
          `Filter "${operator}" requires an array value.`
        );
      }

      if (value.length === 0) {
        throw new Error(
          `Filter "${operator}" requires at least one value.`
        );
      }

      if (
        (
          operator === "BETWEEN" ||
          operator === "NOT BETWEEN"
        ) &&
        value.length !== 2
      ) {
        throw new Error(
          `Filter "${operator}" requires exactly two values.`
        );
      }

      return;
    }

    if (Array.isArray(value)) {
      throw new Error(
        `Filter "${operator}" requires a scalar value.`
      );
    }
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