import { API_BASE_URL } from "../config/env";

function buildUrl(path) {
  const cleanBaseUrl = String(API_BASE_URL || "").replace(/\/$/, "");
  const cleanPath = String(path || "").startsWith("/") ? path : `/${path}`;

  return `${cleanBaseUrl}${cleanPath}`;
}

function extractValidationErrors(responseBody) {
  if (!responseBody) {
    return "";
  }

  if (Array.isArray(responseBody?.errors)) {
    return responseBody.errors
      .map((error) => error?.errorMessage || error?.message || String(error))
      .filter(Boolean)
      .join("\n");
  }

  if (responseBody?.errors && typeof responseBody.errors === "object") {
    return Object.values(responseBody.errors)
      .flat()
      .filter(Boolean)
      .join("\n");
  }

  return "";
}

function extractErrorMessage(responseBody, responseText, fallbackMessage) {
  const validationErrors = extractValidationErrors(responseBody);

  return (
    validationErrors ||
    responseBody?.errorMessage ||
    responseBody?.message ||
    responseBody?.title ||
    responseText ||
    fallbackMessage ||
    "Não foi possível concluir a requisição."
  );
}

function buildHeaders(body, token) {
  const headers = {
    Accept: "application/json",
  };

  if (body !== null && body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function buildRequestBody(body) {
  if (body === null || body === undefined) {
    return undefined;
  }

  return JSON.stringify(body);
}

async function parseResponse(response) {
  const responseText = await response.text();

  if (!responseText) {
    return null;
  }

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

export async function apiRequest({
  path,
  method = "GET",
  body = null,
  token = null,
  fallbackMessage = "Não foi possível concluir a requisição.",
}) {
  if (!API_BASE_URL) {
    throw new Error("URL base da API não configurada.");
  }

  const response = await fetch(buildUrl(path), {
    method,
    headers: buildHeaders(body, token),
    body: buildRequestBody(body),
  });

  const responseBody = await parseResponse(response);
  const responseText =
    typeof responseBody === "string" ? responseBody : "";

  if (!response.ok) {
    throw new Error(
      extractErrorMessage(responseBody, responseText, fallbackMessage)
    );
  }

  return responseBody;
}