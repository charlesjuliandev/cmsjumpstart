function getRequiredEnv(
  name: string
): string {
  const value =
    process.env[name]?.trim();

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}`
    );
  }

  return value;
}

export function getDrupalEnv() {
  return {
    baseUrl:
      getRequiredEnv(
        "DRUPAL_BASE_URL"
      ),

    username:
      getRequiredEnv(
        "HTAUTH_U"
      ),

    password:
      getRequiredEnv(
        "HTAUTH_P"
      ),

    consumerId:
      getRequiredEnv(
        "CONSUMERUUID"
      ),

    apiKey:
      getRequiredEnv(
        "UP_API_KEY"
      )
  };
}

