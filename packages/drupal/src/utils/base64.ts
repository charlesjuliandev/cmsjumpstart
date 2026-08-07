export function encodeBase64(
  value: string
): string {
  if (typeof btoa === "function") {
    return btoa(value);
  }

  throw new Error(
    "Base64 encoding is not available in this environment."
  );
}