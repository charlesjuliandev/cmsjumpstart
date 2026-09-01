"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var DrupalClient_1 = require("../src/client/DrupalClient");
var client = new DrupalClient_1.DrupalClient({
    baseUrl: (_a = process.env.DRUPAL_BASE_URL) !== null && _a !== void 0 ? _a : "",
    auth: {
        type: "api-key",
        key: (_b = process.env.DRUPAL_API_KEY) !== null && _b !== void 0 ? _b : ""
    }
});
var response = await client
    .resource("node--page")
    .limit(5)
    .get();
console.log(JSON.stringify(response, null, 2));
