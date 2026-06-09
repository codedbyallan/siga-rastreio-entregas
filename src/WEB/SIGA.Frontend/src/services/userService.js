import { getAuthHeaders } from "./authService";

const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function createUser(userData) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/users`, {
    method: "POST",
    headers: getAuthHeaders(true),
    body: JSON.stringify(userData),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível cadastrar o usuário.";

    throw new Error(errorMessage);
  }

  return responseBody;
}

export async function getCouriers() {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/users/couriers`, {
    headers: getAuthHeaders(),
  });

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível buscar os entregadores.";

    throw new Error(errorMessage);
  }

  return responseBody;
}

export async function getCouriersByCompanyId(companyId) {
  if (!companyId) {
    throw new Error("Empresa não informada para buscar entregadores.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/users/couriers/company/${encodeURIComponent(companyId)}`,
    {
      headers: getAuthHeaders(),
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível buscar os entregadores da empresa.";

    throw new Error(errorMessage);
  }

  return responseBody;
}

export async function updateUser(userId, userData) {
  if (!userId) {
    throw new Error("ID do usuário não informado.");
  }

  const response = await fetch(
    `${GATEWAY_BASE_URL}/api/users/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: getAuthHeaders(true),
      body: JSON.stringify(userData),
    }
  );

  const responseBody = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage =
      responseBody?.errors?.[0]?.errorMessage ||
      responseBody?.message ||
      "Não foi possível atualizar o perfil do usuário.";

    throw new Error(errorMessage);
  }

  return responseBody;
}