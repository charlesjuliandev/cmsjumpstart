"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
var DrupalClient_1 = require("../src/client/DrupalClient");
if (!process.env.DRUPAL_BASE_URL) {
    throw new Error("Missing DRUPAL_BASE_URL environment variable");
}
var client = new DrupalClient_1.DrupalClient({
    baseUrl: process.env.DRUPAL_BASE_URL,
    auth: {
        type: "basic",
        username: process.env.DRUPAL_USERNAME,
        password: process.env.DRUPAL_PASSWORD
    },
    headers: {
        "X-Consumer-ID": process.env.DRUPAL_CONSUMER_ID,
        "api-key": process.env.DRUPAL_API_KEY
    }
});
var response = await client
    .resource("node--page")
    .include("field_image")
    .limit(5)
    .get();
console.log(JSON.stringify(response, null, 2));
