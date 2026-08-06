export type CMSProvider =
  | "drupal"
  | "wordpress"
  | "contentful"
  | "strapi";

export interface CMSJumpstartConfig {
  site: {
    name: string;
    url: string;
  };

  cms: {
    provider: CMSProvider;
    url: string;
  };

  features?: {
    search?: boolean;
    preview?: boolean;
  };
}