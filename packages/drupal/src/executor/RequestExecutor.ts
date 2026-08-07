import { AuthProvider } from "../auth/AuthProvider";

export interface RequestExecutorOptions {
  baseUrl: string;
  headers?: Record<string, string>;
  auth?: AuthProvider;
}

export class RequestExecutor {
  private readonly baseUrl: string;
  private readonly headers: Record<string, string>;

  constructor(
    options: RequestExecutorOptions
  ) {
    this.baseUrl =
      options.baseUrl.replace(/\/$/, "");

    this.headers = {
        Accept: "application/vnd.api+json",
        ...options.auth?.getHeaders(),
        ...options.headers
    };
  }

  getHeaders() {
    return this.headers;
  }

  async get<T>(
    path: string,
    params?: URLSearchParams
  ): Promise<T> {
    const url =
      new URL(
        path,
        `${this.baseUrl}/`
      );

    if (params) {
      url.search =
        params.toString();
    }

    const response =
      await fetch(url, {
        method: "GET",
        headers: this.headers
      });

    if (!response.ok) {
      throw new Error(
        `Request failed with status ${response.status}`
      );
    }

    return response.json() as Promise<T>;
  }
}