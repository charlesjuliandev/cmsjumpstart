import "dotenv/config";

import { DrupalClient } from "../src/client/DrupalClient";

if (!process.env.DRUPAL_BASE_URL) {
  throw new Error(
    "Missing DRUPAL_BASE_URL environment variable"
  );
}


const client =
  new DrupalClient({
    baseUrl:
      process.env.DRUPAL_BASE_URL!,

    auth: {
      type: "basic",
      username:
        process.env.DRUPAL_USERNAME!,
      password:
        process.env.DRUPAL_PASSWORD!
    },

    headers: {
      "X-Consumer-ID":
        process.env.DRUPAL_CONSUMER_ID!,

      "api-key":
        process.env.DRUPAL_API_KEY!
    }
  });


const response =
  await client
    .resource("node--page")
    .include(
      "field_image"
    )
    .limit(5)
    .get();


console.log(
  JSON.stringify(
    response,
    null,
    2
  )
);