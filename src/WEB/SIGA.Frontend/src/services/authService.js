const GATEWAY_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export async function authenticateUser(email, password) {
  const response = await fetch(`${GATEWAY_BASE_URL}/api/users/authenticate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const responseText = await response.text();

  let responseBody = null;

  try {
    responseBody = responseText ? JSON.parse(responseText) : null;
  } catch {
    responseBody = null;
  }

  if (!response.ok) {
    const errorMessage =
      responseBody?.message ||
      responseBody?.errors?.[0]?.errorMessage ||
      responseText ||
      "E-mail ou senha inválidos.";

    throw new Error(errorMessage);
  }

  if (!responseBody) {
    throw new Error(
      "Login realizado, mas a API não retornou os dados do usuário."
    );
  }

  return responseBody;
}

export function saveAuthData(authData) {
  localStorage.setItem("siga_token", authData.token);
  localStorage.setItem("siga_user", JSON.stringify(authData.user));
}

export function getLoggedUser() {
  const user = localStorage.getItem("siga_user");
  return user ? JSON.parse(user) : null;
}

export function getToken() {
  return localStorage.getItem("siga_token");
}

export function getAuthHeaders(includeContentType = false) {
  const token = getToken();

  const headers = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export function logout() {
  localStorage.removeItem("siga_token");
  localStorage.removeItem("siga_user");
}