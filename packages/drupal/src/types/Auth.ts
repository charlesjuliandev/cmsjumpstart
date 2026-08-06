export type DrupalAuth =
  | {
      type: "none";
    }
  | {
      type: "api-key";
      key: string;
      header?: string;
    }
  | {
      type: "bearer";
      token: string;
    }
  | {
      type: "basic";
      username: string;
      password: string;
    };