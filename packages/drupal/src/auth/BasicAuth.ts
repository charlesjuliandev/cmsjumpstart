import { AuthProvider } from "./AuthProvider";

export class BasicAuth implements AuthProvider {
  constructor(
    private readonly username: string,
    private readonly password: string
  ) {}

  getHeaders(): Record<string, string> {
    const credentials = Buffer.from(
      `${this.username}:${this.password}`
    ).toString("base64");

    return {
      Authorization: `Basic ${credentials}`
    };
  }
}