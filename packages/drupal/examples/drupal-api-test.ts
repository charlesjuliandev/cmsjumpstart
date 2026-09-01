import { DrupalClient } from "../src/client/DrupalClient";

const client = new DrupalClient({
  baseUrl: process.env.DRUPAL_BASE_URL ?? "",
  auth: {
    type: "api-key",
    key: process.env.DRUPAL_API_KEY ?? ""
  }
});

const response = await client
  .resource("node--page")
  .limit(5)
  .get();

console.log(
  JSON.stringify(
    response,
    null,
    2
  )
);