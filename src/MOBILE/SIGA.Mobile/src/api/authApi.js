import { apiRequest } from "./apiClient";

function cleanEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function cleanPassword(password) {
  return String(password || "").trim();
}

export async function authenticateUserApi(email, password) {
  const normalizedEmail = cleanEmail(email);
  const normalizedPassword = cleanPassword(password);

  if (!normalizedEmail) {
    throw new Error("Informe o e-mail.");
  }

  if (!/\S+@\S+\.\S+/.test(normalizedEmail)) {
    throw new Error("Informe um e-mail válido.");
  }

  if (!normalizedPassword) {
    throw new Error("Informe a senha.");
  }

  return apiRequest({
    path: "/api/users/authenticate",
    method: "POST",
    body: {
      email: normalizedEmail,
      password: normalizedPassword,
    },
    fallbackMessage: "E-mail ou senha inválidos.",
  });
}