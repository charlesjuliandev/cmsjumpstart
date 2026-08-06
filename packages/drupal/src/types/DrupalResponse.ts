export interface DrupalResponse<T> {
  jsonapi: {
    version: string;
  };

  data: T[];

  included?: unknown[];

  links?: Record<string, unknown>;

  meta?: Record<string, unknown>;
}