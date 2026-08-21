"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNextCMS = createNextCMS;
var drupal_1 = require("@cmsjumpstart/drupal");
function createNextCMS(config) {
    return new drupal_1.DrupalClient(config.drupal);
}
