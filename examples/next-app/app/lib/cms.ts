import {
  createNextCMS
} from "@cmsjumpstart/next";

export const cms =
  createNextCMS({
    drupal: {
      baseUrl:
        process.env.DRUPAL_BASE_URL ??
        "https://example.com",

      auth: {
        type: "basic",

        username:
          process.env.HTAUTH_U ?? "",

        password:
          process.env.HTAUTH_P ?? ""
      },

      headers: {
        ...(process.env.CONSUMERUUID
          ? {
              "X-Consumer-ID":
                process.env.CONSUMERUUID
            }
          : {}),

        ...(process.env.UP_API_KEY
          ? {
              "api-key":
                process.env.UP_API_KEY
            }
          : {})
      }
    }
  });