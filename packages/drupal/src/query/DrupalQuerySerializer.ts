import type {
  DrupalQueryBuilder
} from "./DrupalQueryBuilder";

import type {
  DrupalFilterValue
} from "./types";

export class DrupalQuerySerializer {
  static serialize(
    query: DrupalQueryBuilder
  ): URLSearchParams {
    const params =
      new URLSearchParams();

    const options =
      query.getOptions();

    if (options.includes?.length) {
      params.set(
        "include",
        options.includes.join(",")
      );
    }

    if (options.fields?.length) {
      params.set(
        `fields[${query.getResourceType()}]`,
        options.fields.join(",")
      );
    }

    if (options.sort?.length) {
      params.set(
        "sort",
        options.sort.join(",")
      );
    }

    if (options.page !== undefined) {
      params.set(
        "page[offset]",
        String(
          options.page *
            (options.limit ?? 0)
        )
      );
    }

    if (options.limit !== undefined) {
      params.set(
        "page[limit]",
        String(options.limit)
      );
    }

    if (options.filters?.length) {
      options.filters.forEach(
        (
          {
            field,
            operator,
            value
          },
          index
        ) => {
          /*
           * Equality filters use Drupal's
           * shorthand syntax.
           *
           * filter[field]=value
           */
          if (operator === "=") {
            DrupalQuerySerializer.setValue(
              params,
              `filter[${field}]`,
              value
            );

            return;
          }

          /*
           * All non-equality operators use
           * Drupal JSON:API condition syntax.
           *
           * filter[condition_0][condition][path]
           * filter[condition_0][condition][operator]
           * filter[condition_0][condition][value]
           */
          const conditionPrefix =
            `filter[condition_${index}][condition]`;

          params.set(
            `${conditionPrefix}[path]`,
            field
          );

          params.set(
            `${conditionPrefix}[operator]`,
            operator
          );

          /*
           * IS NULL and IS NOT NULL intentionally
           * have no value parameter.
           */
          if (
            operator === "IS NULL" ||
            operator === "IS NOT NULL"
          ) {
            return;
          }

          DrupalQuerySerializer.setValue(
            params,
            `${conditionPrefix}[value]`,
            value
          );
        }
      );
    }

    return params;
  }

  private static setValue(
    params: URLSearchParams,
    key: string,
    value: DrupalFilterValue | undefined
  ): void {
    if (Array.isArray(value)) {
      value.forEach(
        (item, index) => {
          params.set(
            `${key}[${index + 1}]`,
            String(item)
          );
        }
      );

      return;
    }

    params.set(
      key,
      String(value)
    );
  }
}