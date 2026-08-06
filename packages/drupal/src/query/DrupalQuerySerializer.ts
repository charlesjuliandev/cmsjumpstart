import type { DrupalQueryBuilder } from "./DrupalQueryBuilder";

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

    if (options.filters) {
      Object.entries(options.filters)
        .forEach(([key, value]) => {
          params.set(
            `filter[${key}]`,
            String(value)
          );
        });
    }

    return params;
  }
}