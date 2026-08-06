export interface DrupalQueryOptions {
  includes?: string[];
  filters?: Record<string, string | number | boolean>;
  sort?: string[];
  page?: number;
  limit?: number;
}