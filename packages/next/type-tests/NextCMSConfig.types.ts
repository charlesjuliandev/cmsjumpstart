import type {
  NextCMSConfig
} from "../src/config/NextCMSConfig";

const validConfig: NextCMSConfig = {
  drupal: {
    baseUrl:
      "https://example.com"
  }
};

const authenticatedConfig:
  NextCMSConfig = {
    drupal: {
      baseUrl:
        "https://example.com",

      auth: {
        type: "bearer",
        token: "test-token"
      }
    }
  };

const configuredRequest:
  NextCMSConfig = {
    drupal: {
      baseUrl:
        "https://example.com",

      request: {
        cache:
          "force-cache",

        headers: {
          "X-Consumer-ID":
            "cmsjumpstart-test"
        }
      }
    }
  };

void validConfig;
void authenticatedConfig;
void configuredRequest;

