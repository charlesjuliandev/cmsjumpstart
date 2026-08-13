export type DrupalFilterOperator =
  | "="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<=";

export interface DrupalFilter {
  field: string;
  operator: DrupalFilterOperator;
  value: string | number | boolean;
}

export interface DrupalQueryOptions {
  includes?: string[];

  filters?: DrupalFilter[];

  sort?: string[];

  page?: number;

  limit?: number;
}