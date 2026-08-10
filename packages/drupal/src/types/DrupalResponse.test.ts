import { describe, expect, it } from "vitest";
import type {
  DrupalResponse,
  DrupalJsonApiRelationship
} from "./DrupalResponse";

describe("DrupalResponse", () => {
  it("represents a Drupal JSON:API collection response", () => {
    const response: DrupalResponse<
      {
        title: string;
        status: boolean;
      },
      {
        field_image: DrupalJsonApiRelationship;
      }
    > = {
      jsonapi: {
        version: "1.0"
      },

      data: [
        {
          type: "node--page",
          id: "3a5334d6-da3e-4a37-9327-d148ce4e1aec",

          attributes: {
            title: "Fountains",
            status: true
          },

          relationships: {
            field_image: {
              data: null
            }
          },

          links: {
            self: {
              href: "https://example.com/jsonapi/node/page/3a5334d6"
            }
          }
        }
      ],

      included: [
        {
          type: "media--image",
          id: "image-123",

          attributes: {
            name: "Fountains"
          }
        }
      ],

      links: {
        self: {
          href: "https://example.com/jsonapi/node/page"
        },

        next: {
          href: "https://example.com/jsonapi/node/page?page[offset]=5"
        }
      }
    };

    expect(response.jsonapi.version).toBe("1.0");

    expect(response.data).toHaveLength(1);

    expect(response.data[0].type).toBe("node--page");
    expect(response.data[0].id).toBe(
      "3a5334d6-da3e-4a37-9327-d148ce4e1aec"
    );

    expect(response.data[0].attributes.title).toBe(
      "Fountains"
    );

    expect(response.data[0].attributes.status).toBe(true);

    expect(
      response.data[0].relationships?.field_image.data
    ).toBeNull();

    expect(response.included).toHaveLength(1);
    expect(response.included?.[0].type).toBe("media--image");

    expect(response.links?.next).toBeDefined();
  });
});