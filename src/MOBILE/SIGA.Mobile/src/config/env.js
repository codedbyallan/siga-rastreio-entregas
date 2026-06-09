const DEFAULT_API_BASE_URL = "http://localhost:5000";

function normalizeBaseUrl(url) {
  return String(url || "")
    .trim()
    .replace(/\/$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL
);
