export type DrupalFilterOperator =
  | "="
  | "<>"
  | ">"
  | ">="
  | "<"
  | "<="
  | "STARTS_WITH"
  | "CONTAINS"
  | "ENDS_WITH"
  | "IN"
  | "NOT IN"
  | "BETWEEN"
  | "NOT BETWEEN"
  | "IS NULL"
  | "IS NOT NULL";

export type DrupalFilterValue =
  | string
  | number
  | boolean
  | Array<string | number | boolean>;

export interface DrupalFilter {
  field: string;
  operator: DrupalFilterOperator;
  value?: DrupalFilterValue;
}

export interface DrupalQueryOptions {
  includes?: string[];
  fields?: string[];
  filters?: DrupalFilter[];
  sort?: string[];
  page?: number;
  limit?: number;
}