import type {
  DrupalQueryBuilder
} from "./DrupalQueryBuilder";

export class DrupalQuerySerializer {
  static serialize(
    query: DrupalQueryBuilder
  ): URLSearchParams {
    const params = new URLSearchParams();

    const options = query.getOptions();

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
          options.page * (options.limit ?? 0)
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
        ({ field, operator, value }, index) => {
          if (operator === "=") {
            params.set(
              `filter[${field}]`,
              String(value)
            );

            return;
          }

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

          params.set(
            `${conditionPrefix}[value]`,
            String(value)
          );
        }
      );
    }

    return params;
  }
}